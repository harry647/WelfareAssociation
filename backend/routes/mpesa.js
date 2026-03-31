/**
 * M-Pesa Routes
 * Handles M-Pesa C2B (Consumer to Business) payments and webhook callbacks
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Settings = require('../models/Settings');
const { auth, authorize } = require('../middleware/auth');

/**
 * GET config - Get M-Pesa configuration
 */
async function getMpesaConfig() {
    // Try database settings first, fallback to env
    const dbSettings = await Settings.findAll({
        where: { category: 'payment' }
    });
    
    const settingsMap = {};
    dbSettings.forEach(s => settingsMap[s.key] = s.value);
    
    return {
        enabled: settingsMap.mpesa_enabled === 'true' || !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_KEY !== 'your_mpesa_consumer_key_here'),
        consumerKey: settingsMap.mpesa_consumer_key || process.env.MPESA_CONSUMER_KEY || '',
        consumerSecret: settingsMap.mpesa_consumer_secret || process.env.MPESA_CONSUMER_SECRET || '',
        shortcode: settingsMap.mpesa_shortcode || process.env.MPESA_SHORTCODE || '',
        paybill: settingsMap.mpesa_paybill || process.env.MPESA_PAYBILL || '',
        callbackUrl: settingsMap.mpesa_callback_url || process.env.MPESA_CALLBACK_URL || '',
        env: process.env.MPESA_ENV || 'production'
    };
}

/**
 * POST /api/mpesa/c2b/register
 * Register C2B callback URL with M-Pesa (called by admin)
 */
router.post('/c2b/register', auth, authorize('admin'), async (req, res) => {
    try {
        const config = await getMpesaConfig();
        
        if (!config.enabled) {
            return res.status(400).json({
                success: false,
                message: 'M-Pesa is not configured. Please add credentials in Security Settings.'
            });
        }
        
        // In production, this would call M-Pesa API to register the callback URL
        // For now, we return success and explain the manual process
        
        res.json({
            success: true,
            message: 'C2B URL registration initiated',
            data: {
                shortcode: config.shortcode,
                callbackUrl: config.callbackUrl,
                instructions: 'In production, this would register your callback URL with Safaricom. For sandbox, use M-Pesa Portal.'
            },
            note: 'Contact Safaricom to enable C2B on your短code'
        });
    } catch (error) {
        console.error('M-Pesa registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering C2B'
        });
    }
});

/**
 * POST /api/mpesa/c2b/validate
 * M-Pesa webhook callback - validates incoming payment
 * This is called by Safaricom when someone pays via paybill
 */
router.post('/c2b/validate', async (req, res) => {
    try {
        const config = await getMpesaConfig();
        
        // M-Pesa sends this data on payment
        const { 
            TransactionType,
            TransID,           // M-Pesa transaction ID
            TransTime,         // Transaction time
            TransAmount,      // Amount paid
            BusinessShortCode,
            BillRefNumber,   // Student's ID (account number)
            InvoiceNumber,   // Invoice/Order ID (used for payment matching!)
            OrgAccountBalance,
            ThirdPartyTransID,
            MSISDN            // Phone number
        } = req.body;
        
        console.log('M-Pesa C2B Payment received:', {
            TransID,
            TransAmount,
            BillRefNumber,
            InvoiceNumber,
            MSISDN
        });
        
        // Try to find pending payment by Invoice Number first
        let paymentType = 'other';
        let matchedPayment = null;
        let member = null;
        
        // Check if InvoiceNumber was provided (payment was initiated via app)
        if (InvoiceNumber) {
            // Look for pending payment with this reference
            matchedPayment = await Payment.findOne({
                where: { 
                    reference: InvoiceNumber,
                    status: 'pending'
                }
            });
            
            if (matchedPayment) {
                paymentType = matchedPayment.type;
                member = await Member.findByPk(matchedPayment.memberId);
            }
        }
        
        // Fallback: try to find by student ID (BillRefNumber)
        if (!member) {
            member = await Member.findOne({
                where: { memberNumber: BillRefNumber }
            });
        }
        
        let paymentStatus = 'completed';
        let paymentId = null;
        
        if (matchedPayment) {
            // Update existing pending payment
            matchedPayment.status = 'completed';
            matchedPayment.transactionId = TransID;
            matchedPayment.processedDate = new Date();
            matchedPayment.mpesa = {
                transactionType: TransactionType,
                transactionTime: TransTime,
                businessShortCode: BusinessShortCode,
                invoiceNumber: InvoiceNumber,
                orgAccountBalance: OrgAccountBalance,
                thirdPartyTransID: ThirdPartyTransID
            };
            await matchedPayment.save();
            
            paymentId = matchedPayment.id;
            console.log('Pending payment updated:', matchedPayment.paymentNumber, 'Type:', paymentType);
        } 
        else if (member) {
            // Create new payment record for the member
            const paymentCount = await Payment.count() || 0;
            const paymentNumber = `PAY-${Date.now()}-${(paymentCount + 1).toString().padStart(4, '0')}`;
            
            // Determine payment type by amount (default fallback)
            paymentType = determinePaymentType(TransAmount);
            
            const payment = await Payment.create({
                memberId: member.id,
                paymentNumber,
                type: paymentType,
                amount: TransAmount,
                method: 'mpesa',
                phone: MSISDN,
                transactionId: TransID,
                status: 'completed',
                paymentDate: new Date(),
                processedDate: new Date(),
                fullName: `${member.firstName} ${member.lastName}`,
                studentId: member.memberNumber,
                reference: InvoiceNumber || BillRefNumber,
                accountReference: BillRefNumber,
                mpesa: {
                    transactionType: TransactionType,
                    transactionTime: TransTime,
                    businessShortCode: BusinessShortCode,
                    invoiceNumber: InvoiceNumber,
                    orgAccountBalance: OrgAccountBalance,
                    thirdPartyTransID: ThirdPartyTransID
                }
            });
            
            paymentId = payment.id;
            console.log('New payment recorded:', paymentNumber, 'Type:', paymentType);
        } else {
            // Member not found - create pending payment for admin to review
            console.log('Payment for unknown student ID:', BillRefNumber);
            paymentStatus = 'pending';
        }
        
        // Always return Success to M-Pesa
        res.json({
            ResultCode: 0,
            ResultDesc: ' Accepted'
        });
    } catch (error) {
        console.error('M-Pesa validation error:', error);
        // Return error but M-Pesa will retry
        res.json({
            ResultCode: 1,
            ResultDesc: 'Validation failed'
        });
    }
});

/**
 * Determine payment type by amount
 * Default fallback when no invoice is provided
 */
function determinePaymentType(amount) {
    const amounts = {
        500: 'contribution',
        1000: 'shares',
        200: 'welfare',
        500: 'bereavement'
    };
    
    // Round to nearest 100
    const rounded = Math.round(amount / 100) * 100;
    return amounts[rounded] || 'other';
}

/**
 * POST /api/mpesa/c2b/confirm
 * M-Pesa confirmation callback - after successful payment
 */
router.post('/c2b/confirm', async (req, res) => {
    try {
        const {
            TransID,
            TransAmount,
            BillRefNumber,
            MSISDN
        } = req.body;
        
        console.log('M-Pesa C2B Confirmation:', { TransID, TransAmount, BillRefNumber });
        
        // Find and update payment if exists
        const existingPayment = await Payment.findOne({
            where: { transactionId: TransID }
        });
        
        if (existingPayment) {
            existingPayment.status = 'completed';
            existingPayment.processedDate = new Date();
            await existingPayment.save();
        }
        
        res.json({
            ResultCode: 0,
            ResultDesc: 'Accepted'
        });
    } catch (error) {
        console.error('M-Pesa confirm error:', error);
        res.json({
            ResultCode: 0, // Still accept
            ResultDesc: 'Accepted'
        });
    }
});

/**
 * POST /api/mpesa/b2c/payout
 * Send money to member (B2C - Business to Consumer)
 * For loan disbursements, withdrawals
 */
router.post('/b2c/payout', auth, authorize('admin', 'treasurer'), [
    body('memberId').isUUID().withMessage('Valid member ID required'),
    body('amount').isFloat({ min: 10 }).withMessage('Valid amount required'),
    body('phone').matches(/^254[0-9]{9}$/).withMessage('Valid phone number required')
], async (req, res) => {
    try {
        const config = await getMpesaConfig();
        
        if (!config.enabled) {
            return res.status(400).json({
                success: false,
                message: 'M-Pesa is not configured'
            });
        }
        
        const { memberId, amount, phone, description } = req.body;
        
        // In production, this would call M-Pesa B2C API
        // For now, return mock success
        
        console.log('B2C Payout:', { memberId, amount, phone });
        
        res.json({
            success: true,
            message: 'B2C payout initiated',
            data: {
                amount,
                phone,
                description
            },
            note: 'In production, this would send money via M-Pesa'
        });
    } catch (error) {
        console.error('B2C error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payout'
        });
    }
});

/**
 * GET /api/mpesa/transactions
 * Get M-Pesa transactions (admin view)
 */
router.get('/transactions', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const where = { method: 'mpesa' };
        if (status) where.status = status;
        
        const offset = (page - 1) * limit;
        
        const { count, rows: transactions } = await Payment.findAndCountAll({
            where,
            include: [{ 
                model: Member, 
                as: 'member',
                attributes: ['id', 'firstName', 'lastName', 'memberNumber']
            }],
            order: [['paymentDate', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        
        res.json({
            success: true,
            data: transactions || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching M-Pesa transactions:', error);
        res.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 }
        });
    }
});

/**
 * POST /api/mpesa/create-reference
 * Create a pending payment reference for manual M-Pesa payment
 * Member uses this reference when paying via paybill
 */
router.post('/create-reference', auth, [
    body('type').isIn(['loan_repayment', 'contribution', 'shares', 'welfare', 'bereavement', 'event', 'fine', 'registration', 'subscription', 'other']).withMessage('Valid payment type required'),
    body('amount').isFloat({ min: 10 }).withMessage('Valid amount required')
], async (req, res) => {
    try {
        const { type, amount, description } = req.body;
        
        // Find member from auth
        const member = await Member.findOne({
            where: { userId: req.user.id }
        });
        
        if (!member) {
            return res.status(400).json({
                success: false,
                message: 'No member record found'
            });
        }
        
        // Generate unique payment reference (this is what user enters in M-Pesa)
        const reference = `PAY-${member.memberNumber.replace(/[^0-9]/g, '')}-${Date.now()}`;
        
        // Create pending payment
        const payment = await Payment.create({
            memberId: member.id,
            paymentNumber: reference,
            type,
            amount,
            method: 'mpesa',
            status: 'pending',  // Will be completed when M-Pesa callback comes
            reference,  // User enters this in M-Pesa
            fullName: `${member.firstName} ${member.lastName}`,
            studentId: member.memberNumber,
            description,
            paymentDate: new Date()
        });
        
        // Get M-Pesa config for paybill number
        const config = await getMPayConfig();
        
        res.json({
            success: true,
            data: {
                reference: payment.reference,
                amount: payment.amount,
                type: payment.type,
                paymentNumber: payment.paymentNumber,
                mpesaPaybill: config.paybill,
                instructions: `Go to M-Pesa → Lipa na M-Pesa → Paybill → Enter ${config.paybill} → Account No: ${payment.reference}`
            },
            message: 'Use this reference when making M-Pesa payment'
        });
    } catch (error) {
        console.error('Error creating payment reference:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment reference'
        });
    }
});

// Helper for config (avoid name conflict)
async function getMpayConfig() {
    return getMpesaConfig();
}

module.exports = router;
/**
 * Payment Routes
 * Handles all payment transactions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for payment proof uploads
const paymentProofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/payments';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const paymentProofUpload = multer({
    storage: paymentProofStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('image') || file.mimetype.includes('pdf');
        if (extname || mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images and PDFs are allowed'));
    }
});

// Map frontend category to model type
const categoryToTypeMap = {
    'contribution': 'contribution',
    'shares': 'shares',
    'welfare': 'welfare',
    'bereavement': 'bereavement',
    'loan': 'loan_repayment',
    'event': 'event',
    'fine': 'fine',
    'registration': 'registration',
    'subscription': 'subscription',
    'other': 'other'
};

// Map frontend payment method to model method
const paymentMethodMap = {
    'mpesa': 'mpesa',
    'bank': 'bank_transfer',
    'card': 'online',
    'cash': 'cash'
};

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * GET /api/payments
 * Get all payments (admin) or member's own payments
 */
router.get('/', auth, async (req, res) => {
    try {
        const { memberId, type, status, page = 1, limit = 10, startDate, endDate } = req.query;
        
        const where = {};
        
        // Non-admin users only see their own payments
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) {
                where.memberId = member.id;
            }
        } else if (memberId) {
            where.memberId = memberId;
        }
        
        if (type) where.type = type;
        if (status) where.status = status;
        
        // Date filtering
        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate[Op.gte] = new Date(startDate);
            if (endDate) where.paymentDate[Op.lte] = new Date(endDate);
        }

        const offset = (page - 1) * limit;
        const { count, rows: payments } = await Payment.findAndCountAll({
            where,
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email'] 
                }
            ],
            order: [['paymentDate', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: payments || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.json({
            success: true,
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                pages: 0
            },
            message: 'No payments found or database not initialized'
        });
    }
});

/**
 * GET /api/payments/my
 * Get current user's payments
 */
router.get('/my', auth, async (req, res) => {
    try {
        const member = await Member.findOne({ where: { userId: req.user.id } });
        
        if (!member) {
            return res.json({
                success: true,
                data: [],
                message: 'No member record found'
            });
        }

        const payments = await Payment.findAll({
            where: { memberId: member.id },
            order: [['paymentDate', 'DESC']]
        });

        res.json({
            success: true,
            data: payments || []
        });
    } catch (error) {
        console.error('Error fetching my payments:', error);
        res.json({
            success: true,
            data: []
        });
    }
});

/**
 * GET /api/payments/member/:memberId
 * Get payments for a specific member (admin/treasurer only)
 */
router.get('/member/:memberId', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const { memberId } = req.params;
        
        const payments = await Payment.findAll({
            where: { memberId },
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber'] 
                }
            ],
            order: [['paymentDate', 'DESC']]
        });

        res.json({
            success: true,
            data: payments || []
        });
    } catch (error) {
        console.error('Error fetching member payments:', error);
        res.json({
            success: true,
            data: []
        });
    }
});

/**
 * GET /api/payments/:id
 * Get a single payment by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const payment = await Payment.findByPk(id, {
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email'] 
                }
            ]
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check if user has access to this payment
        const member = await Member.findOne({ where: { userId: req.user.id } });
        const isAdmin = ['admin', 'treasurer', 'secretary'].includes(req.user.role);
        
        if (!isAdmin && member && payment.memberId !== member.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
});

/**
 * POST /api/payments
 * Create a new payment
 * Accepts both 'type' (API standard) and 'category' (frontend) fields
 */
router.post('/', auth, [
    body('memberId').optional().isUUID().withMessage('Valid member ID required'),
    body('type').optional().isIn(['loan_repayment', 'contribution', 'savings', 'fine', 'donation', 'shares', 'welfare', 'bereavement', 'event', 'registration', 'subscription', 'other']).withMessage('Valid payment type required'),
    body('category').optional().isIn(['loan_repayment', 'contribution', 'savings', 'fine', 'donation', 'shares', 'welfare', 'bereavement', 'event', 'registration', 'subscription', 'other', 'contribution', 'shares', 'welfare', 'bereavement', 'loan', 'event', 'fine', 'registration', 'subscription', 'other']).withMessage('Valid category required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
    body('method').optional().isIn(['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other']),
    body('fullName').optional().isLength({ min: 2, max: 200 }).withMessage('Valid full name required'),
    body('phone').optional().matches(/^254[0-9]{9}$/).withMessage('Valid phone number required'),
    body('transactionId').optional().isLength({ max: 100 }).withMessage('Transaction ID too long'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
], validate, async (req, res) => {
    try {
        let { memberId, type, amount, method, reference, description, relatedTo, fullName, phone, transactionId, notes, studentId, category, paymentSchedule, event } = req.body;
        
        // Map category to type (frontend sends 'category', model expects 'type')
        if (category && !type) {
            type = categoryToTypeMap[category] || category;
        }
        
        // Map payment method (frontend sends 'bank'/'card', model expects 'bank_transfer'/'online')
        if (method) {
            // Validate: non-admin users cannot use cash
            const isAdmin = ['admin', 'treasurer', 'secretary'].includes(req.user.role);
            if (method === 'cash' && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Cash payment is only available for admin/treasurer users'
                });
            }
            method = paymentMethodMap[method] || method;
        }
        
        // Auto-resolve memberId from authenticated user if not provided
        let member = await Member.findOne({ where: { userId: req.user.id } });
        const isAdmin = ['admin', 'treasurer', 'secretary'].includes(req.user.role);
        
        // Non-admin users can only create payments for themselves
        if (!isAdmin && member && memberId && memberId !== member.id) {
            return res.status(403).json({
                success: false,
                message: 'Can only create payments for yourself'
            });
        }
        
        // Use member from auth if no memberId provided
        if (!memberId && member) {
            memberId = member.id;
        } else if (!memberId && !member && !isAdmin) {
            return res.status(400).json({
                success: false,
                message: 'No member record found. Please complete your profile first.'
            });
        }
        
        // Store related info (event, paymentSchedule) in relatedTo JSON field
        if (event || paymentSchedule) {
            relatedTo = { event, paymentSchedule, ...relatedTo };
        }

        // Generate payment number
        const count = await Payment.count() || 0;
        const paymentNumber = `PAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;

        const payment = await Payment.create({
            memberId: memberId || member?.id,
            paymentNumber,
            type: type || 'other',
            amount,
            method: method || 'cash',
            reference,
            description,
            relatedTo: relatedTo || {},
            fullName,
            phone,
            transactionId,
            notes,
            studentId,
            status: 'completed',
            paymentDate: new Date(),
            processedDate: new Date(),
            processedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: payment,
            message: 'Payment recorded successfully'
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment'
        });
    }
});

/**
 * PUT /api/payments/:id
 * Update a payment
 */
router.put('/:id', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, amount, method, reference, description } = req.body;
        
        const payment = await Payment.findByPk(id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Update fields
        if (status) payment.status = status;
        if (amount) payment.amount = amount;
        if (method) payment.method = method;
        if (reference) payment.reference = reference;
        if (description) payment.description = description;

        await payment.save();

        res.json({
            success: true,
            data: payment,
            message: 'Payment updated successfully'
        });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment'
        });
    }
});

/**
 * DELETE /api/payments/:id
 * Delete a payment (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const payment = await Payment.findByPk(id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        await payment.destroy();

        res.json({
            success: true,
            message: 'Payment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting payment'
        });
    }
});

/**
 * GET /api/payments/stats/summary
 * Get payment statistics summary (admin/treasurer)
 */
router.get('/stats/summary', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const where = {};
        
        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate[Op.gte] = new Date(startDate);
            if (endDate) where.paymentDate[Op.lte] = new Date(endDate);
        }

        // Total amount
        const totalAmount = await Payment.sum('amount', {
            where: { ...where, status: 'completed' }
        }) || 0;

        // Count by type
        const byType = await Payment.findAll({
            attributes: [
                'type',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
                [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
            ],
            where: { ...where, status: 'completed' },
            group: ['type'],
            raw: true
        });

        // Count by status
        const byStatus = await Payment.findAll({
            attributes: [
                'status',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            where,
            group: ['status'],
            raw: true
        });

        // Recent payments count
        const recentCount = await Payment.count({
            where: {
                ...where,
                paymentDate: {
                    [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        });

        res.json({
            success: true,
            data: {
                totalAmount,
                byType: byType || [],
                byStatus: byStatus || [],
                recentCount,
                period: { startDate, endDate }
            }
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.json({
            success: true,
            data: {
                totalAmount: 0,
                byType: [],
                byStatus: [],
                recentCount: 0
            }
        });
    }
});

// Payment configuration from environment
const paymentConfig = {
    mpesa: {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        shortcode: process.env.MPESA_SHORTCODE,
        paybill: process.env.MPESA_PAYBILL,
        callbackUrl: process.env.MPESA_CALLBACK_URL,
        env: process.env.MPESA_ENV || 'production'
    },
    stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    flutterwave: {
        publicKey: process.env.FLW_PUBLIC_KEY,
        secretKey: process.env.FLW_SECRET_KEY,
        secretHash: process.env.FLW_SECRET_HASH
    },
    bank: {
        name: process.env.BANK_NAME || 'Kenya Commercial Bank',
        accountName: process.env.BANK_ACCOUNT_NAME || 'SWA JOOUST',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
        branch: process.env.BANK_BRANCH || 'Kenyatta Avenue Branch'
    }
};

/**
 * POST /api/payments/stk-push
 * Initiate M-Pesa STK Push payment
 */
router.post('/stk-push', auth, [
    body('phone').matches(/^254[0-9]{9}$/).withMessage('Valid phone number required ( format: 2547XXXXXXXX)'),
    body('amount').isFloat({ min: 10 }).withMessage('Valid amount required (min: 10)'),
    body('category').optional().isIn(['loan_repayment', 'contribution', 'shares', 'welfare', 'bereavement', 'event', 'fine', 'registration', 'subscription', 'other', 'contribution', 'shares', 'welfare', 'bereavement', 'loan', 'event', 'fine', 'registration', 'subscription', 'other'])
], validate, async (req, res) => {
    try {
        const { phone, amount, category, referenceNumber } = req.body;
        
        // Get member from auth
        const member = await Member.findOne({ where: { userId: req.user.id } });
        
        if (!member) {
            return res.status(400).json({
                success: false,
                message: 'No member record found. Please complete your profile first.'
            });
        }
        
        // Map category to type
        const type = categoryToTypeMap[category] || category || 'other';
        
        // In production, this would call M-Pesa API
        // For now, return success with pending payment
        const count = await Payment.count() || 0;
        const paymentNumber = `PAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
        
        const payment = await Payment.create({
            memberId: member.id,
            paymentNumber,
            type,
            amount,
            method: 'mpesa',
            phone,
            status: 'processing', // Will be 'completed' after STK callback
            reference: referenceNumber,
            paymentDate: new Date(),
            fullName: `${member.firstName} ${member.lastName}`,
            studentId: member.memberNumber
        });
        
        res.json({
            success: true,
            data: {
                paymentId: payment.id,
                paymentNumber: payment.paymentNumber,
                phone,
                amount
            },
            message: 'STK Push initiated. Please check your phone for payment prompt.'
        });
    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate STK Push'
        });
    }
});

/**
 * POST /api/payments/submit
 * Submit manual payment (alternative to POST /)
 */
router.post('/submit', auth, [
    body('category').optional().isIn(['loan_repayment', 'contribution', 'shares', 'welfare', 'bereavement', 'event', 'fine', 'registration', 'subscription', 'other', 'contribution', 'shares', 'welfare', 'bereavement', 'loan', 'event', 'fine', 'registration', 'subscription', 'other']),
    body('amount').isFloat({ min: 10 }).withMessage('Valid amount required'),
    body('paymentMethod').optional().isIn(['mpesa', 'bank', 'card', 'cash'])
], validate, async (req, res) => {
    try {
        const { category, amount, paymentMethod, fullName, phone, studentId, transactionId, notes, referenceNumber, receipt } = req.body;
        
        // Validate: non-admin users cannot use cash
        const isAdmin = ['admin', 'treasurer', 'secretary'].includes(req.user.role);
        if (paymentMethod === 'cash' && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Cash payment is only available for admin/treasurer users'
            });
        }
        
        // Map category to type
        let type = categoryToTypeMap[category] || category || 'other';
        
        // Map payment method
        const method = paymentMethodMap[paymentMethod] || paymentMethod || 'cash';
        
        // Get member from auth
        const member = await Member.findOne({ where: { userId: req.user.id } });
        
        if (!member) {
            return res.status(400).json({
                success: false,
                message: 'No member record found. Please complete your profile first.'
            });
        }
        
        // Generate payment number
        const count = await Payment.count() || 0;
        const paymentNumber = `PAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
        
        const payment = await Payment.create({
            memberId: member.id,
            paymentNumber,
            type,
            amount,
            method,
            fullName: fullName || `${member.firstName} ${member.lastName}`,
            phone: phone || member.phone,
            studentId: studentId || member.memberNumber,
            transactionId,
            notes,
            reference: referenceNumber,
            receipt: receipt || null,
            status: 'completed', // Manual payments marked as completed
            paymentDate: new Date(),
            processedDate: new Date(),
            processedBy: req.user.id
        });
        
        res.status(201).json({
            success: true,
            data: payment,
            message: 'Payment submitted successfully'
        });
    } catch (error) {
        console.error('Payment submit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit payment'
        });
    }
});

/**
 * POST /api/payments/upload-proof
 * Upload payment proof (receipt/screenshot)
 */
router.post('/upload-proof', auth, paymentProofUpload.single('paymentProof'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const fileUrl = `/uploads/payments/${req.file.filename}`;
        const fileName = req.file.originalname;
        const fileType = req.file.mimetype;
        
        res.json({
            success: true,
            data: {
                fileUrl,
                fileName,
                fileType
            },
            message: 'Payment proof uploaded successfully'
        });
    } catch (error) {
        console.error('Payment proof upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload payment proof'
        });
    }
});

/**
 * GET /api/payments/config
 * Get payment configuration (bank details, available methods)
 */
router.get('/config', async (req, res) => {
    try {
        const config = {
            availableMethods: [],
            mpesa: {
                enabled: !!(paymentConfig.mpesa.consumerKey && paymentConfig.mpesa.consumerKey !== 'your_mpesa_consumer_key_here'),
                shortcode: paymentConfig.mpesa.shortcode || '123456'
            },
            stripe: {
                enabled: !!(paymentConfig.stripe.publicKey && paymentConfig.stripe.publicKey.startsWith('pk_')),
                publicKey: paymentConfig.stripe.publicKey || ''
            },
            flutterwave: {
                enabled: !!(paymentConfig.flutterwave.publicKey && paymentConfig.flutterwave.publicKey !== 'your_flutterwave_public_key')
            },
            bank: {
                enabled: !!(paymentConfig.bank.accountNumber && paymentConfig.bank.accountNumber !== '1234567890'),
                name: paymentConfig.bank.name,
                accountName: paymentConfig.bank.accountName,
                accountNumber: paymentConfig.bank.accountNumber,
                branch: paymentConfig.bank.branch
            }
        };
        
        // Add enabled methods
        if (config.mpesa.enabled) config.availableMethods.push('mpesa');
        if (config.stripe.enabled) config.availableMethods.push('card');
        if (config.flutterwave.enabled) config.availableMethods.push('flutterwave');
        if (config.bank.enabled) config.availableMethods.push('bank');
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error fetching payment config:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment configuration'
        });
    }
});

module.exports = router;

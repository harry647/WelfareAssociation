/**
 * Payment Routes
 * Handles all payment transactions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { Op, sequelize } = require('sequelize');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generatePDFReceipt, generateReceiptHTML } = require('../utils/pdf-receipt');

// Lazy load models to avoid circular dependencies
const getModel = (modelName) => {
    switch (modelName) {
        case 'Loan': return require('../models/Loan');
        case 'Contribution': return require('../models/Contribution');
        case 'Savings': return require('../models/Savings');
        case 'Bereavement': return require('../models/Bereavement');
        case 'Event': return require('../models/Event');
        case 'Fine': return require('../models/Fine');
        case 'Settings': return require('../models/Settings');
        case 'Donation': return require('../models/Donation');
        case 'Share': return require('../models/Share');
        case 'Registration': return require('../models/Registration');
        case 'Subscription': return require('../models/Subscription');
        default: return null;
    }
};

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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/receipts/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('image') || file.mimetype.includes('pdf');
        if (extname || mimetype) {
            cb(null, true);
        } else {
            cb(null, false);
        }
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
    try {
        const errors = validationResult(req);
        if (errors && !errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    } catch (error) {
        console.error('Validation error:', error);
        next();
    }
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
 * GET /api/payments/config
 * Get payment configuration (bank details, available methods)
 * NOTE: This route MUST be defined BEFORE /:id to avoid being matched as an ID
 */
router.get('/config', auth, async (req, res) => {
    console.log('DEBUG: Config route reached');
    try {
        const config = {
            availableMethods: ['cash'], // Always enable cash by default
            mpesa: {
                enabled: !!(paymentConfig.mpesa.consumerKey && paymentConfig.mpesa.consumerKey.includes('placeholder')),
                shortcode: paymentConfig.mpesa.shortcode || '123456',
                paybill: paymentConfig.mpesa.paybill || '123456'
            },
            stripe: {
                enabled: !!(paymentConfig.stripe.publicKey && paymentConfig.stripe.publicKey.startsWith('pk_')),
                publicKey: paymentConfig.stripe.publicKey || ''
            },
            flutterwave: {
                enabled: !!(paymentConfig.flutterwave.publicKey && paymentConfig.flutterwave.publicKey.includes('placeholder')),
            },
            bank: {
                enabled: !!(paymentConfig.bank.accountNumber && paymentConfig.bank.accountNumber.includes('placeholder')),
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
        
        // Handle admin user case - admin doesn't have a member record
        if (req.user.id === 'admin') {
            // Try to find a member by the provided studentId or name
            let member = null;
            
            if (studentId) {
                member = await Member.findOne({ where: { memberNumber: studentId } });
            }
            
            if (!member && fullName) {
                // Try to find by name
                const names = fullName.split(' ');
                if (names.length >= 2) {
                    member = await Member.findOne({
                        where: {
                            firstName: names[0],
                            lastName: names[names.length - 1]
                        }
                    });
                }
            }
            
            if (!member) {
                // Find any active member as fallback
                member = await Member.findOne({
                    where: { membershipStatus: 'active' },
                    order: [['createdAt', 'ASC']]
                });
            }
            
            // Generate payment number
            const count = await Payment.count() || 0;
            const paymentNumber = `PAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
            
            const payment = await Payment.create({
                memberId: member ? member.id : null,
                paymentNumber,
                type,
                amount,
                method,
                fullName: fullName || 'Guest Payment',
                phone: phone || null,
                studentId: studentId || (member ? member.memberNumber : 'GUEST'),
                transactionId,
                notes,
                reference: referenceNumber,
                receipt: receipt || null,
                status: 'completed', // Manual payments marked as completed
                paymentDate: new Date(),
                processedDate: new Date(),
                processedBy: req.user.id
            });
            
            return res.json({
                success: true,
                data: { paymentId: payment.id, paymentNumber: payment.paymentNumber },
                message: 'Payment recorded successfully'
            });
        }
        
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
            relatedTo: req.body.relatedTo || {}, // Include relatedTo from frontend
            status: 'completed', // Manual payments marked as completed
            paymentDate: new Date(),
            processedDate: new Date(),
            processedBy: req.user.id
        });
        
        // Update related entity based on payment type
        // Handle contribution separately - can work without relatedToId
        if (type === 'contribution') {
            const Contribution = getModel('Contribution');
            let contribution;
            let relatedToId = null;
            if (payment.relatedTo) {
                if (typeof payment.relatedTo === 'string') {
                    relatedToId = payment.relatedTo;
                } else if (payment.relatedTo.id) {
                    relatedToId = payment.relatedTo.id;
                }
            }
            
            // If relatedToId provided, find and update existing contribution
            if (relatedToId) {
                contribution = await Contribution.findByPk(relatedToId);
                if (contribution) {
                    await contribution.update({
                        amount: parseFloat(contribution.amount || 0) + parseFloat(amount),
                        status: 'completed',
                        paymentDate: new Date(),
                        paymentReference: payment.reference,
                        paymentMethod: payment.method
                    });
                    console.log(`Contribution ${contribution.id} updated`);
                }
            }
            
            // If no relatedToId or contribution not found, auto-create a new contribution
            if (!contribution) {
                const count = await Contribution.count() || 0;
                // Generate shorter contribution number: CONT-timestamp-seq (max 20 chars)
                const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
                const contributionNumber = `CONT-${timestamp}-${(count + 1).toString().padStart(3, '0')}`; // CONT-12345678-001 (19 chars)
                
                contribution = await Contribution.create({
                    memberId: payment.memberId,
                    contributionNumber,
                    amount: amount,
                    type: 'monthly',
                    status: 'completed',
                    paymentDate: new Date(),
                    paymentReference: payment.reference,
                    paymentMethod: payment.method,
                    recordedBy: payment.processedBy
                });
                console.log(`Auto-created contribution ${contribution.id} for payment`);
            }
            
            // Update member's total contributions
            const member = await Member.findByPk(payment.memberId);
            if (member) {
                const currentTotal = parseFloat(member.totalContributions || 0);
                await member.update({
                    totalContributions: currentTotal + parseFloat(amount)
                });
                console.log(`Member ${member.id} totalContributions updated to ${currentTotal + parseFloat(amount)}`);
            }
        } else if (type === 'savings') {
            // Auto-create savings record when no relatedToId
            const Savings = getModel('Savings');
            const count = await Savings.count() || 0;
            const savingsNumber = `SAV-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
            
            const savings = await Savings.create({
                memberId: payment.memberId,
                savingsNumber,
                amount: amount,
                type: 'deposit',
                status: 'completed',
                paymentDate: new Date(),
                paymentReference: payment.reference
            });
            console.log(`Auto-created savings ${savings.id} for payment`);
            
            // Update member's total savings
            const memberSavings = await Member.findByPk(payment.memberId);
            if (memberSavings) {
                const currentTotal = parseFloat(memberSavings.totalSavings || 0);
                await memberSavings.update({
                    totalSavings: currentTotal + parseFloat(amount)
                });
                console.log(`Member ${memberSavings.id} totalSavings updated to ${currentTotal + parseFloat(amount)}`);
            }
        } else if (type === 'welfare') {
            // Welfare payments don't need relatedToId - just update global welfare balance
            const Settings = getModel('Settings');
            const welfareSettings = await Settings.findOne({ where: { key: 'welfare_balance' } });
            if (welfareSettings) {
                await welfareSettings.update({
                    value: (parseFloat(welfareSettings.value) + parseFloat(amount)).toString()
                });
                console.log(`Welfare balance updated`);
            } else {
                // Create welfare balance setting if it doesn't exist
                await Settings.create({
                    key: 'welfare_balance',
                    value: amount.toString(),
                    category: 'financial'
                });
                console.log(`Welfare balance created with initial value`);
            }
        } else if (type === 'shares') {
            // Auto-create share record when no relatedToId
            try {
                const Share = getModel('Share');
                const count = await Share.count() || 0;
                // Generate shorter share number: SHR-timestamp-seq (max 30 chars)
                const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
                const shareNumber = `SHR-${timestamp}-${(count + 1).toString().padStart(3, '0')}`; // SHR-12345678-001 (19 chars)
                
                const share = await Share.create({
                    memberId: payment.memberId,
                    shareNumber,
                    amount: amount,
                    numberOfShares: Math.floor(amount / 100), // Assume 100 per share
                    sharePrice: 100.00,
                    status: 'paid',
                    paymentDate: new Date(),
                    paymentReference: payment.reference,
                    recordedBy: payment.processedBy
                });
                console.log(`Auto-created share ${share.id} for payment`);
            } catch (err) {
                console.log(`Shares table not available: ${err.message}`);
            }
        } else if (type === 'registration') {
            // Auto-create registration record when no relatedToId
            try {
                const Registration = getModel('Registration');
                const count = await Registration.count() || 0;
                // Generate shorter registration number: REG-timestamp-seq (max 30 chars)
                const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
                const registrationNumber = `REG-${timestamp}-${(count + 1).toString().padStart(3, '0')}`; // REG-12345678-001 (19 chars)
                
                const registration = await Registration.create({
                    memberId: payment.memberId,
                    registrationNumber,
                    amount: amount,
                    registrationType: 'new',
                    status: 'completed',
                    registrationDate: new Date(),
                    paymentDate: new Date(),
                    paymentReference: payment.reference,
                    recordedBy: payment.processedBy
                });
                console.log(`Auto-created registration ${registration.id} for payment`);
            } catch (err) {
                console.log(`Registration table not available: ${err.message}`);
            }
        } else if (type === 'subscription') {
            // Auto-create subscription record when no relatedToId
            try {
                const Subscription = getModel('Subscription');
                const count = await Subscription.count() || 0;
                // Generate shorter subscription number: SUB-timestamp-seq (max 30 chars)
                const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
                const subscriptionNumber = `SUB-${timestamp}-${(count + 1).toString().padStart(3, '0')}`; // SUB-12345678-001 (19 chars)
                
                const subscription = await Subscription.create({
                    memberId: payment.memberId,
                    subscriptionNumber,
                    amount: amount,
                    subscriptionType: 'monthly',
                    status: 'active',
                    startDate: new Date(),
                    paymentDate: new Date(),
                    lastPaymentDate: new Date(),
                    paymentReference: payment.reference,
                    recordedBy: payment.processedBy
                });
                console.log(`Auto-created subscription ${subscription.id} for payment`);
            } catch (err) {
                console.log(`Subscription table not available: ${err.message}`);
            }
        } else if (type === 'other') {
            // Generic payment - no specific entity to update
            console.log(`Generic payment recorded: ${payment.reference} - amount: ${amount}`);
        } else {
            // Handle both string ID and object formats for relatedTo
            let relatedToId = null;
            if (payment.relatedTo) {
                if (typeof payment.relatedTo === 'string') {
                    relatedToId = payment.relatedTo;
                } else if (payment.relatedTo.id) {
                    relatedToId = payment.relatedTo.id;
                }
            }
            
            // For bereavement payments, try to find an active bereavement for the member
            // If no active bereavement for paying member, search for any active bereavement
            if (type === 'bereavement' && !relatedToId) {
                const Bereavement = getModel('Bereavement');
                let bereavement = await Bereavement.findOne({
                    where: {
                        memberId: payment.memberId,
                        status: 'active'
                    }
                });
                
                // If no active bereavement for this member, search for any active bereavement
                // (member might be contributing to another member's bereavement)
                if (!bereavement) {
                    bereavement = await Bereavement.findOne({
                        where: {
                            status: 'active'
                        },
                        order: [['createdAt', 'ASC']]
                    });
                }
                
                if (bereavement) {
                    relatedToId = bereavement.id;
                    console.log(`Found active bereavement ${bereavement.id} for payment`);
                } else {
                    console.log(`No active bereavement found in system for bereavement payment`);
                }
            }
            
            if (relatedToId) {
            switch (type) {
                case 'loan_repayment': {
                    const Loan = getModel('Loan');
                    const loan = await Loan.findByPk(relatedToId);
                    if (loan) {
                        const currentBalance = parseFloat(loan.remainingBalance || loan.balance || 0);
                        const newBalance = currentBalance - parseFloat(amount);
                        const newStatus = newBalance <= 0 ? 'completed' : 'active';
                        await loan.update({
                            remainingBalance: Math.max(0, newBalance).toString(),
                            status: newStatus,
                            updatedAt: new Date()
                        });
                        console.log(`Loan ${loan.id} updated: balance=${newBalance}, status=${newStatus}`);
                    }
                    // Update member's total loans
                    const memberLoan = await Member.findByPk(payment.memberId);
                    if (memberLoan) {
                        const currentTotal = parseFloat(memberLoan.totalLoans || 0);
                        await memberLoan.update({
                            totalLoans: Math.max(0, currentTotal - parseFloat(amount))
                        });
                        console.log(`Member ${memberLoan.id} totalLoans updated`);
                    }
                    break;
                }
                case 'event': {
                    const Event = getModel('Event');
                    let event = null;
                    
                    // First try to find by UUID
                    try {
                        event = await Event.findByPk(relatedToId);
                    } catch (uuidError) {
                        // If not a valid UUID, try to find by title or other identifier
                        event = await Event.findOne({
                            where: {
                                [sequelize.Sequelize.Op.or]: [
                                    { title: { [sequelize.Sequelize.Op.iLike]: relatedToId } },
                                    { type: { [sequelize.Sequelize.Op.iLike]: relatedToId } }
                                ]
                            }
                        });
                    }
                    
                    if (event) {
                        // Track registered attendees or payments
                        const currentAttendees = event.registeredAttendees || 0;
                        await event.update({
                            registeredAttendees: currentAttendees + 1,
                            updatedAt: new Date()
                        });
                        console.log(`Event ${event.id} (${event.title}) payment recorded, attendees: ${currentAttendees + 1}`);
                    } else {
                        console.log(`Event not found for relatedToId: ${relatedToId}`);
                    }
                    break;
                }
                case 'fine': {
                    const Fine = getModel('Fine');
                    const fine = await Fine.findByPk(relatedToId);
                    if (fine) {
                        await fine.update({
                            status: 'paid',
                            paidDate: new Date(),
                            paymentMethod: payment.method,
                            paymentReference: payment.reference
                        });
                        console.log(`Fine ${fine.id} marked as paid`);
                    }
                    break;
                }
                case 'bereavement': {
                    const Bereavement = getModel('Bereavement');
                    const bereavement = await Bereavement.findByPk(relatedToId);
                    if (bereavement) {
                        // Update bereavement contributions instead of marking as completed
                        const currentContributions = parseFloat(bereavement.totalContributions || 0);
                        const newTotal = currentContributions + parseFloat(amount);
                        
                        // Get existing contributions array or initialize empty
                        const existingContributions = bereavement.contributions || [];
                        const newContribution = {
                            memberId: payment.memberId,
                            amount: parseFloat(amount),
                            paymentId: payment.id,
                            paymentMethod: payment.method,
                            reference: payment.reference,
                            date: new Date()
                        };
                        
                        await bereavement.update({
                            totalContributions: newTotal,
                            contributions: [...existingContributions, newContribution]
                        });
                        console.log(`Bereavement ${bereavement.id} updated with contribution of ${amount}, total: ${newTotal}`);
                    }
                    break;
                }
                case 'donation': {
                    const Donation = getModel('Donation');
                    const donation = await Donation.findByPk(relatedToId);
                    if (donation) {
                        await donation.update({
                            status: 'completed',
                            paymentDate: new Date(),
                            paymentReference: payment.reference
                        });
                        console.log(`Donation ${donation.id} marked as completed`);
                    }
                    break;
                }
                default:
                    console.log(`Payment type ${type} requires relatedToId but none provided`);
            }
            } else {
                console.log(`No relatedTo ID found for payment type ${type}`);
            }
        }
        
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
 * POST /api/payments/receipt
 * Generate PDF receipt for payment
 */
router.post('/receipt', auth, [
    body('reference').notEmpty().withMessage('Reference number is required'),
    body('studentId').notEmpty().withMessage('Student ID is required')
], validate, async (req, res) => {
    try {
        const { reference, studentId } = req.body;
        
        // First, find member by studentId (which is stored in memberNumber field)
        let member = await Member.findOne({
            where: {
                memberNumber: studentId
            }
        });
        
        // Try to find payment by reference first
        let payment = await Payment.findOne({
            where: { reference: reference },
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email'] 
                }
            ]
        });
        
        // If payment found but member doesn't match, check if we have the right member
        if (payment && !member) {
            // Use the member from the payment record
            member = payment.member;
        }
        
        // If still no payment found, try with memberId if we have a member
        if (!payment && member) {
            payment = await Payment.findOne({
                where: { reference: reference, memberId: member.id },
                include: [
                    { 
                        model: Member, 
                        as: 'member', 
                        attributes: ['firstName', 'lastName', 'memberNumber', 'email'] 
                    }
                ]
            });
        }
        
        if (!payment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Payment not found' 
            });
        }
        
        // Generate HTML receipt directly (simpler, no puppeteer needed)
        const paymentDetails = {
            referenceNumber: reference,
            fullName: payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : payment.fullName || 'N/A',
            studentId: studentId || payment.studentId || 'N/A',
            amount: payment.amount,
            paymentMethod: payment.method,
            status: payment.status,
            transactionId: payment.transactionId,
            paymentDate: payment.paymentDate,
            category: payment.type || 'N/A',
            logoUrl: '/images/logo.png',
            mpesaPaybill: '247247',
            bankAccount: 'Bank of Barichbank Plc - 01-2345678',
            accountName: 'Student Welfare Association'
        };
        
        const htmlContent = generateReceiptHTML(paymentDetails);
        
        // Return HTML content directly in response so frontend can display it
        res.json({
            success: true,
            message: 'Receipt generated successfully',
            data: {
                htmlContent: htmlContent,
                reference: reference
            }
        });
    } catch (error) {
        console.error('Error generating PDF receipt:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating PDF receipt: ' + error.message 
        });
    }
});

/**
 * GET /api/payments/download/:reference
 * Download generated PDF receipt
 */
router.get('/download/:reference', auth, async (req, res) => {
    try {
        const { reference } = req.params;
        const receiptPath = path.join(__dirname, '../../receipts', `receipt-${reference}-${Date.now()}.pdf`);
        
        // Try to find any matching receipt file
        const receiptsDir = path.join(__dirname, '../../receipts');
        if (fs.existsSync(receiptsDir)) {
            const files = fs.readdirSync(receiptsDir).filter(f => f.startsWith(`receipt-${reference}-`));
            if (files.length > 0) {
                const actualPath = path.join(receiptsDir, files[0]);
                res.download(actualPath, `receipt-${reference}.pdf`);
                return;
            }
        }
        
        res.status(404).json({ 
            success: false, 
            message: 'Receipt not found' 
        });
    } catch (error) {
        console.error('Error downloading receipt:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error downloading receipt: ' + error.message 
        });
    }
});

module.exports = router;

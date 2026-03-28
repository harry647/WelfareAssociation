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
 */
router.post('/', auth, [
    body('memberId').isUUID().withMessage('Valid member ID required'),
    body('type').isIn(['loan_repayment', 'contribution', 'savings', 'fine', 'donation', 'other']).withMessage('Valid payment type required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
    body('method').optional().isIn(['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'])
], validate, async (req, res) => {
    try {
        const { memberId, type, amount, method, reference, description, relatedTo } = req.body;
        
        // Check permissions
        const member = await Member.findOne({ where: { userId: req.user.id } });
        const isAdmin = ['admin', 'treasurer', 'secretary'].includes(req.user.role);
        
        // Non-admin users can only create payments for themselves
        if (!isAdmin && member && memberId !== member.id) {
            return res.status(403).json({
                success: false,
                message: 'Can only create payments for yourself'
            });
        }

        // Generate payment number
        const count = await Payment.count() || 0;
        const paymentNumber = `PAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;

        const payment = await Payment.create({
            memberId,
            paymentNumber,
            type,
            amount,
            method: method || 'cash',
            reference,
            description,
            relatedTo: relatedTo || {},
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

module.exports = router;

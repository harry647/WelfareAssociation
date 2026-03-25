/**
 * Debt Routes
 * Handles member debts and reminders
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Debt = require('../models/Debt');
const Member = require('../models/Member');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/debts
 * Get all debts
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, memberId, page = 1, limit = 10 } = req.query;
        const where = {};

        // Non-admin users only see their own debts
        if (!['admin', 'treasurer'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) where.memberId = member.id;
        } else if (memberId) {
            where.memberId = memberId;
        }

        if (status) where.status = status;

        const debts = await Debt.findAndCountAll({
            where,
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ],
            order: [['dueDate', 'ASC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            success: true,
            data: debts.rows,
            pagination: {
                total: debts.count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(debts.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch debts' });
    }
});

/**
 * GET /api/debts/pending
 * Get pending debts
 */
router.get('/pending', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const debts = await Debt.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ],
            order: [['dueDate', 'ASC']]
        });

        res.json({ success: true, data: debts });
    } catch (error) {
        console.error('Error fetching pending debts:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending debts' });
    }
});

/**
 * GET /api/debts/overdue
 * Get overdue debts
 */
router.get('/overdue', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const debts = await Debt.findAll({
            where: {
                status: { [Op.in]: ['pending', 'overdue'] },
                dueDate: {
                    [Op.lt]: new Date()
                }
            },
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ],
            order: [['dueDate', 'ASC']]
        });

        res.json({ success: true, data: debts });
    } catch (error) {
        console.error('Error fetching overdue debts:', error);
        res.status(500).json({ success: false, message: 'Error fetching overdue debts' });
    }
});

/**
 * GET /api/debts/statistics
 * Get debt statistics
 */
router.get('/statistics', auth, async (req, res) => {
    try {
        const { Op } = require('sequelize');
        
        const totalOutstanding = await Debt.sum('remainingBalance', {
            where: { status: { [Op.in]: ['pending', 'overdue'] } }
        }) || 0;

        const totalDebts = await Debt.count({
            where: { status: { [Op.in]: ['pending', 'overdue'] } }
        });

        const overdueCount = await Debt.count({
            where: {
                status: { [Op.in]: ['pending', 'overdue'] },
                dueDate: {
                    [Op.lt]: new Date()
                }
            }
        });

        const paidThisMonth = await Debt.sum('paidAmount', {
            where: {
                status: 'paid',
                updatedAt: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }) || 0;

        const membersInDebt = await Debt.count({
            distinct: true,
            col: 'memberId',
            where: { status: { [Op.in]: ['pending', 'overdue'] } }
        });

        res.json({
            success: true,
            data: {
                totalOutstanding,
                totalDebts,
                overdueCount,
                paidThisMonth,
                membersInDebt
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/debts/total
 * Get total outstanding debt
 */
router.get('/total', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const result = await Debt.sum('remainingBalance', {
            where: {
                status: { [Op.in]: ['pending', 'overdue'] }
            }
        });

        res.json({ success: true, data: { total: result || 0 } });
    } catch (error) {
        console.error('Error fetching total:', error);
        res.status(500).json({ success: false, message: 'Error fetching total' });
    }
});

/**
 * GET /api/debts/:id
 * Get debt by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const debt = await Debt.findByPk(req.params.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ]
        });

        if (!debt) {
            return res.status(404).json({ success: false, message: 'Debt not found' });
        }

        res.json({ success: true, data: debt });
    } catch (error) {
        console.error('Error fetching debt:', error);
        res.status(500).json({ success: false, message: 'Error fetching debt' });
    }
});

/**
 * POST /api/debts
 * Create debt (admin)
 */
router.post('/', auth, authorize('admin', 'treasurer'), [
    body('memberId').notEmpty(),
    body('amount').isNumeric(),
    body('dueDate').isISO8601(),
    body('type').optional(),
    validate
], async (req, res) => {
    try {
        const { memberId, amount, dueDate, type, description, relatedTo } = req.body;

        const debt = await Debt.create({
            memberId,
            amount,
            dueDate,
            type: type || 'other',
            description,
            relatedTo,
            remainingBalance: amount
        });

        res.status(201).json({ success: true, message: 'Debt created', data: debt });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating debt' });
    }
});

/**
 * PATCH /api/debts/:id/pay
 * Mark debt as paid
 */
router.patch('/:id/pay', auth, async (req, res) => {
    try {
        const { amount, method, reference } = req.body;
        const debt = await Debt.findByPk(req.params.id);

        if (!debt) {
            return res.status(404).json({ success: false, message: 'Debt not found' });
        }

        // Parse existing payments or create new array
        const payments = typeof debt.payments === 'string' ? JSON.parse(debt.payments) : (debt.payments || []);
        payments.push({ date: new Date(), amount, method, reference });
        
        debt.paidAmount = (parseFloat(debt.paidAmount) || 0) + parseFloat(amount);
        debt.remainingBalance = parseFloat(debt.amount) - debt.paidAmount;
        debt.payments = payments;

        if (debt.remainingBalance <= 0) {
            debt.status = 'paid';
            debt.remainingBalance = 0;
        }

        await debt.save();

        res.json({ success: true, message: 'Payment recorded', data: debt });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ success: false, message: 'Error recording payment' });
    }
});

/**
 * POST /api/debts/:id/remind
 * Send debt reminder
 */
router.post('/:id/remind', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const debt = await Debt.findByPk(req.params.id, {
            include: [{ model: Member, as: 'member' }]
        });

        if (!debt) {
            return res.status(404).json({ success: false, message: 'Debt not found' });
        }

        // Parse existing reminders or create new array
        const remindersSent = typeof debt.remindersSent === 'string' ? JSON.parse(debt.remindersSent) : (debt.remindersSent || []);
        remindersSent.push({ date: new Date(), method: 'email', sentBy: req.user.id });
        debt.remindersSent = remindersSent;
        
        await debt.save();

        // In production, send actual email/SMS here

        res.json({ success: true, message: 'Reminder sent' });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ success: false, message: 'Error sending reminder' });
    }
});

/**
 * PATCH /api/debts/:id/waive
 * Waive debt
 */
router.patch('/:id/waive', auth, authorize('admin'), async (req, res) => {
    try {
        const { reason } = req.body;
        const debt = await Debt.findByPk(req.params.id);

        if (!debt) {
            return res.status(404).json({ success: false, message: 'Debt not found' });
        }

        debt.status = 'waived';
        debt.waivedBy = req.user.id;
        debt.waiverReason = reason;
        debt.waivedAt = new Date();

        await debt.save();

        res.json({ success: true, message: 'Debt waived', data: debt });
    } catch (error) {
        console.error('Error waiving debt:', error);
        res.status(500).json({ success: false, message: 'Error waiving debt' });
    }
});

/**
 * DELETE /api/debts/:id
 * Delete debt (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const debt = await Debt.findByPk(req.params.id);
        
        if (!debt) {
            return res.status(404).json({ success: false, message: 'Debt not found' });
        }
        
        await debt.destroy();
        res.json({ success: true, message: 'Debt deleted' });
    } catch (error) {
        console.error('Error deleting debt:', error);
        res.status(500).json({ success: false, message: 'Error deleting debt' });
    }
});

module.exports = router;

/**
 * Savings Routes
 * Handles member savings goals
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Savings = require('../models/Savings');
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
 * GET /api/savings/goals
 * Get all savings goals
 */
router.get('/goals', auth, async (req, res) => {
    try {
        const { status, memberId, page = 1, limit = 10 } = req.query;
        let where = {};

        if (!['admin', 'treasurer'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) where.memberId = member.id;
        } else if (memberId) {
            where.memberId = memberId;
        }

        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { count, rows: goals } = await Savings.findAndCountAll({
            where,
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: goals || [],
            pagination: { page: parseInt(page), limit: parseInt(limit), total: count || 0, pages: Math.ceil((count || 0) / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching savings goals' });
    }
});

/**
 * GET /api/savings/goals/:id
 * Get savings goal by ID
 */
router.get('/goals/:id', auth, async (req, res) => {
    try {
        const goal = await Savings.findById(req.params.id)
            .populate('member', 'firstName lastName memberNumber email')
            .populate('transactions.recordedBy', 'firstName lastName');

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching goal' });
    }
});

/**
 * POST /api/savings/goals
 * Create savings goal
 */
router.post('/goals', auth, [
    body('name').notEmpty().trim(),
    body('targetAmount').isNumeric(),
    validate
], async (req, res) => {
    try {
        const { name, description, targetAmount, targetDate } = req.body;

        const member = await Member.findOne({ userId: req.user._id });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const goal = await Savings.create({
            member: member._id,
            name,
            description,
            targetAmount,
            targetDate
        });

        res.status(201).json({ success: true, message: 'Savings goal created', data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating goal' });
    }
});

/**
 * PUT /api/savings/goals/:id
 * Update savings goal
 */
router.put('/goals/:id', auth, async (req, res) => {
    try {
        const { name, description, targetAmount, targetDate } = req.body;
        const goal = await Savings.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (name) goal.name = name;
        if (description) goal.description = description;
        if (targetAmount) goal.targetAmount = targetAmount;
        if (targetDate) goal.targetDate = targetDate;

        await goal.save();

        res.json({ success: true, message: 'Goal updated', data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating goal' });
    }
});

/**
 * POST /api/savings/goals/:id/savings
 * Add savings to goal
 */
router.post('/goals/:id/savings', auth, [
    body('amount').isNumeric(),
    validate
], async (req, res) => {
    try {
        const { amount, method, reference, note } = req.body;
        const goal = await Savings.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        goal.transactions.push({
            type: 'deposit',
            amount,
            method,
            reference,
            note,
            recordedBy: req.user._id
        });

        goal.currentAmount += amount;

        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = 'completed';
            goal.completedDate = new Date();
        }

        await goal.save();

        res.json({ success: true, message: 'Savings added', data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding savings' });
    }
});

/**
 * POST /api/savings/goals/:id/withdraw
 * Withdraw from goal
 */
router.post('/goals/:id/withdraw', auth, [
    body('amount').isNumeric(),
    validate
], async (req, res) => {
    try {
        const { amount, method, reference, note } = req.body;
        const goal = await Savings.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (amount > goal.currentAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient savings' });
        }

        goal.transactions.push({
            type: 'withdrawal',
            amount,
            method,
            reference,
            note,
            recordedBy: req.user._id
        });

        goal.currentAmount -= amount;

        await goal.save();

        res.json({ success: true, message: 'Withdrawal successful', data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing withdrawal' });
    }
});

/**
 * GET /api/savings/goals/:id/history
 * Get savings history
 */
router.get('/goals/:id/history', auth, async (req, res) => {
    try {
        const goal = await Savings.findById(req.params.id)
            .select('transactions')
            .populate('transactions.recordedBy', 'firstName lastName');

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({ success: true, data: goal.transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching history' });
    }
});

/**
 * PATCH /api/savings/goals/:id/complete
 * Complete goal
 */
router.patch('/goals/:id/complete', auth, async (req, res) => {
    try {
        const goal = await Savings.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        goal.status = 'completed';
        goal.completedDate = new Date();

        await goal.save();

        res.json({ success: true, message: 'Goal completed', data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error completing goal' });
    }
});

/**
 * DELETE /api/savings/goals/:id
 * Delete goal
 */
router.delete('/goals/:id', auth, async (req, res) => {
    try {
        await Savings.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting goal' });
    }
});

/**
 * GET /api/savings/total
 * Get total savings
 */
router.get('/total', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const result = await Savings.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: null, total: { $sum: '$currentAmount' } } }
        ]);

        res.json({ success: true, data: { total: result[0]?.total || 0 } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching total' });
    }
});

/**
 * GET /api/savings/statistics
 * Get savings statistics
 */
router.get('/statistics', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const total = await Savings.countDocuments();
        const active = await Savings.countDocuments({ status: 'active' });
        const completed = await Savings.countDocuments({ status: 'completed' });

        const totalSavings = await Savings.aggregate([
            { $group: { _id: null, total: { $sum: '$currentAmount' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalGoals: total,
                activeGoals: active,
                completedGoals: completed,
                totalSavings: totalSavings[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

module.exports = router;

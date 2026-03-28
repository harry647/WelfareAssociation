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
 * GET /api/savings
 * Get all savings with member info (for admin dashboard)
 */
router.get('/', auth, async (req, res) => {
    try {
        const savings = await Savings.findAll({
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ success: true, data: savings });
    } catch (error) {
        console.error('Error fetching savings:', error);
        res.status(500).json({ success: false, message: 'Error fetching savings' });
    }
});

/**
 * GET /api/savings/goals
 * Get all savings goals
 */
router.get('/goals', auth, async (req, res) => {
    try {
        const { status, memberId, page = 1, limit = 10 } = req.query;
        let where = {};

        if (!['admin', 'treasurer'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user._id } });
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
        const goal = await Savings.findByPk(req.params.id, {
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber', 'email'] }
            ]
        });

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({ success: true, data: goal });
    } catch (error) {
        console.error('Error fetching goal:', error);
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

        const member = await Member.findOne({ where: { userId: req.user._id } });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Generate goal number
        const goalCount = await Savings.count() + 1;
        const goalNumber = `SAV${String(goalCount).padStart(6, '0')}`;

        const goal = await Savings.create({
            memberId: member.id,
            goalNumber,
            name,
            description,
            targetAmount,
            targetDate
        });

        res.status(201).json({ success: true, message: 'Savings goal created', data: goal });
    } catch (error) {
        console.error('Error creating goal:', error);
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
        const goal = await Savings.findByPk(req.params.id);

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
        console.error('Error updating goal:', error);
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
        const goal = await Savings.findByPk(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        // Add transaction
        const transactions = goal.transactions || [];
        transactions.push({
            type: 'deposit',
            amount,
            method,
            reference,
            note,
            recordedBy: req.user._id,
            date: new Date()
        });
        goal.transactions = transactions;
        goal.currentAmount = parseFloat(goal.currentAmount || 0) + parseFloat(amount);

        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = 'completed';
            goal.completedDate = new Date();
        }

        await goal.save();

        res.json({ success: true, message: 'Savings added', data: goal });
    } catch (error) {
        console.error('Error adding savings:', error);
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
        const goal = await Savings.findByPk(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (parseFloat(amount) > parseFloat(goal.currentAmount)) {
            return res.status(400).json({ success: false, message: 'Insufficient savings' });
        }

        // Add transaction
        const transactions = goal.transactions || [];
        transactions.push({
            type: 'withdrawal',
            amount,
            method,
            reference,
            note,
            recordedBy: req.user._id,
            date: new Date()
        });
        goal.transactions = transactions;
        goal.currentAmount = parseFloat(goal.currentAmount || 0) - parseFloat(amount);

        await goal.save();

        res.json({ success: true, message: 'Withdrawal successful', data: goal });
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ success: false, message: 'Error processing withdrawal' });
    }
});

/**
 * GET /api/savings/goals/:id/history
 * Get savings history
 */
router.get('/goals/:id/history', auth, async (req, res) => {
    try {
        const goal = await Savings.findByPk(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({ success: true, data: goal.transactions || [] });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, message: 'Error fetching history' });
    }
});

/**
 * PATCH /api/savings/goals/:id/complete
 * Complete goal
 */
router.patch('/goals/:id/complete', auth, async (req, res) => {
    try {
        const goal = await Savings.findByPk(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        goal.status = 'completed';
        goal.completedDate = new Date();

        await goal.save();

        res.json({ success: true, message: 'Goal completed', data: goal });
    } catch (error) {
        console.error('Error completing goal:', error);
        res.status(500).json({ success: false, message: 'Error completing goal' });
    }
});

/**
 * DELETE /api/savings/goals/:id
 * Delete goal
 */
router.delete('/goals/:id', auth, async (req, res) => {
    try {
        const goal = await Savings.findByPk(req.params.id);
        
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        
        await goal.destroy();
        
        res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ success: false, message: 'Error deleting goal' });
    }
});

/**
 * GET /api/savings/total
 * Get total savings
 */
router.get('/total', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const result = await Savings.sum('currentAmount', { where: { status: 'active' } });
        
        res.json({ success: true, data: { total: result || 0 } });
    } catch (error) {
        console.error('Error fetching total:', error);
        res.status(500).json({ success: false, message: 'Error fetching total' });
    }
});

/**
 * GET /api/savings/statistics
 * Get savings statistics
 */
router.get('/statistics', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const total = await Savings.count();
        const active = await Savings.count({ where: { status: 'active' } });
        const completed = await Savings.count({ where: { status: 'completed' } });
        
        const totalSavings = await Savings.sum('currentAmount') || 0;

        // Get member count with active savings
        const savingsWithAmount = await Savings.findAll({
            where: { status: 'active' },
            attributes: ['memberId']
        });
        const uniqueMembers = new Set(savingsWithAmount.map(s => s.memberId)).size;

        // Get this month's deposits and withdrawals
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const allSavings = await Savings.findAll({ where: { status: 'active' } });
        let monthDeposits = 0;
        let monthWithdrawals = 0;
        
        allSavings.forEach(savings => {
            const transactions = savings.transactions || [];
            transactions.forEach(t => {
                const tDate = new Date(t.date);
                if (tDate >= startOfMonth) {
                    if (t.type === 'deposit') monthDeposits += parseFloat(t.amount || 0);
                    if (t.type === 'withdrawal') monthWithdrawals += parseFloat(t.amount || 0);
                }
            });
        });

        res.json({
            success: true,
            data: {
                totalGoals: total,
                activeGoals: active,
                completedGoals: completed,
                totalSavings: totalSavings,
                membersWithSavings: uniqueMembers,
                monthDeposits: monthDeposits,
                monthWithdrawals: monthWithdrawals
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/savings/transactions
 * Get all recent transactions (for admin dashboard)
 */
router.get('/transactions', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        const savings = await Savings.findAll({
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
            ],
            order: [['updatedAt', 'DESC']],
            limit: limit
        });

        // Extract and flatten all transactions
        let allTransactions = [];
        savings.forEach(s => {
            const transactions = s.transactions || [];
            transactions.forEach(t => {
                allTransactions.push({
                    ...t,
                    memberName: s.member ? `${s.member.firstName} ${s.member.lastName}` : 'Unknown',
                    memberNumber: s.member?.memberNumber || 'N/A',
                    goalName: s.name,
                    goalId: s.id
                });
            });
        });

        // Sort by date descending
        allTransactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        res.json({ success: true, data: allTransactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, message: 'Error fetching transactions' });
    }
});

module.exports = router;

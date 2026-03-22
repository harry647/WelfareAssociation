/**
 * Contribution Routes
 * Handles member contributions/dues
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
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
 * GET /api/contributions
 * Get all contributions
 */
router.get('/', auth, async (req, res) => {
    try {
        const { memberId, type, status, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        // Non-admin users only see their own contributions
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ userId: req.user._id });
            if (member) {
                query.member = member._id;
            }
        } else if (memberId) {
            query.member = memberId;
        }
        
        if (type) query.type = type;
        if (status) query.status = status;

        const contributions = await Contribution.find(query)
            .populate('member', 'firstName lastName memberNumber email')
            .populate('recordedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Contribution.countDocuments(query);

        res.json({
            success: true,
            data: contributions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching contributions'
        });
    }
});

/**
 * GET /api/contributions/total
 * Get total contributions
 */
router.get('/total', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const result = await Contribution.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                total: result[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching total'
        });
    }
});

/**
 * GET /api/contributions/summary
 * Get contribution summary
 */
router.get('/summary', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year || new Date().getFullYear();

        // Monthly contributions
        const monthlyContributions = await Contribution.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // By type
        const byType = await Contribution.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Total
        const total = await Contribution.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                yearlyTotal: total[0]?.total || 0,
                monthlyContributions,
                byType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching summary'
        });
    }
});

/**
 * GET /api/contributions/:id
 * Get contribution by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const contribution = await Contribution.findById(req.params.id)
            .populate('member', 'firstName lastName memberNumber email')
            .populate('recordedBy', 'firstName lastName');

        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found'
            });
        }

        res.json({
            success: true,
            data: contribution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching contribution'
        });
    }
});

/**
 * POST /api/contributions/add
 * Add new contribution
 */
router.post('/add', auth, [
    body('amount').isNumeric().custom(val => val > 0),
    body('type').isIn(['monthly', 'special', 'registration', 'voluntary', 'fine', 'other']),
    body('memberId').optional(),
    validate
], async (req, res) => {
    try {
        const { amount, type, period, paymentMethod, paymentReference, description, memberId } = req.body;

        // Determine which member
        let member;
        if (memberId && ['admin', 'treasurer'].includes(req.user.role)) {
            member = await Member.findById(memberId);
        } else {
            member = await Member.findOne({ userId: req.user._id });
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Parse period
        let periodObj = {};
        if (period) {
            periodObj = {
                month: period.month || new Date().getMonth() + 1,
                year: period.year || new Date().getFullYear()
            };
        } else {
            periodObj = {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            };
        }

        const contribution = await Contribution.create({
            member: member._id,
            amount,
            type,
            period: periodObj,
            paymentMethod: paymentMethod || 'cash',
            paymentReference,
            description,
            status: 'completed', // Auto-complete for cash/manual
            recordedBy: req.user._id,
            paymentDate: new Date()
        });

        // Update member's total contributions
        member.totalContributions = (member.totalContributions || 0) + amount;
        await member.save();

        res.status(201).json({
            success: true,
            message: 'Contribution added successfully',
            data: contribution
        });
    } catch (error) {
        console.error('Contribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding contribution'
        });
    }
});

/**
 * PUT /api/contributions/:id
 * Update contribution
 */
router.put('/:id', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { amount, type, status, description } = req.body;

        const contribution = await Contribution.findById(req.params.id);
        
        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found'
            });
        }

        // Update member's contribution total if amount changed
        const member = await Member.findById(contribution.member);
        if (member && amount !== contribution.amount) {
            member.totalContributions = member.totalContributions - contribution.amount + amount;
            await member.save();
        }

        if (amount) contribution.amount = amount;
        if (type) contribution.type = type;
        if (status) contribution.status = status;
        if (description) contribution.description = description;

        await contribution.save();

        res.json({
            success: true,
            message: 'Contribution updated successfully',
            data: contribution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating contribution'
        });
    }
});

/**
 * DELETE /api/contributions/:id
 * Delete contribution
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const contribution = await Contribution.findById(req.params.id);
        
        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found'
            });
        }

        // Update member's total
        const member = await Member.findById(contribution.member);
        if (member) {
            member.totalContributions = Math.max(0, member.totalContributions - contribution.amount);
            await member.save();
        }

        await Contribution.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Contribution deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting contribution'
        });
    }
});

module.exports = router;

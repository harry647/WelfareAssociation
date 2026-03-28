/**
 * Contribution Routes
 * Handles member contributions/dues
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Contribution = require('../models/Contribution');
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
 * GET /api/contributions
 * Get all contributions
 */
router.get('/', auth, async (req, res) => {
    try {
        const { memberId, type, status, page = 1, limit = 10 } = req.query;
        
        const where = {};
        
        // Non-admin users only see their own contributions
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

        const offset = (page - 1) * limit;
        const { count, rows: contributions } = await Contribution.findAndCountAll({
            where,
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: contributions || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        // Return empty data instead of 500 error
        res.json({
            success: true,
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                pages: 0
            },
            message: 'No contributions found or database not initialized'
        });
    }
});

/**
 * GET /api/contributions/total
 * Get total contributions
 */
router.get('/total', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const result = await Contribution.sum('amount', {
            where: { status: 'completed' }
        });

        res.json({
            success: true,
            data: {
                total: result || 0
            }
        });
    } catch (error) {
        console.error('Error fetching total:', error);
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

        // Get all completed contributions for the year
        const contributions = await Contribution.findAll({
            where: {
                status: 'completed',
                createdAt: {
                    [Op.gte]: new Date(`${currentYear}-01-01`),
                    [Op.lt]: new Date(`${currentYear + 1}-01-01`)
                }
            },
            attributes: ['amount', 'type', 'createdAt']
        });

        // Group by month
        const monthlyMap = {};
        const typeMap = {};
        let yearlyTotal = 0;

        contributions.forEach(c => {
            const month = new Date(c.createdAt).getMonth() + 1;
            yearlyTotal += parseFloat(c.amount);

            // Monthly
            if (!monthlyMap[month]) {
                monthlyMap[month] = { month, total: 0, count: 0 };
            }
            monthlyMap[month].total += parseFloat(c.amount);
            monthlyMap[month].count += 1;

            // By type
            if (!typeMap[c.type]) {
                typeMap[c.type] = { _id: c.type, total: 0, count: 0 };
            }
            typeMap[c.type].total += parseFloat(c.amount);
            typeMap[c.type].count += 1;
        });

        const monthlyContributions = Object.values(monthlyMap).sort((a, b) => a.month - b.month);
        const byType = Object.values(typeMap);

        res.json({
            success: true,
            data: {
                yearlyTotal,
                monthlyContributions,
                byType
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
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
        const contribution = await Contribution.findByPk(req.params.id, {
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber', 'email'] },
                { model: User, as: 'recordedBy', attributes: ['firstName', 'lastName'] }
            ]
        });

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
        console.error('Error fetching contribution:', error);
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
            member = await Member.findByPk(memberId);
        } else {
            member = await Member.findOne({ where: { userId: req.user.id } });
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
            memberId: member.id,
            amount,
            type,
            period: periodObj,
            paymentMethod: paymentMethod || 'cash',
            paymentReference,
            description,
            status: 'completed', // Auto-complete for cash/manual
            recordedBy: req.user.id,
            paymentDate: new Date()
        });

        // Update member's total contributions
        const currentTotal = parseFloat(member.totalContributions) || 0;
        await member.update({
            totalContributions: currentTotal + parseFloat(amount)
        });

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

        const contribution = await Contribution.findByPk(req.params.id);
        
        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found'
            });
        }

        // Update member's contribution total if amount changed
        if (amount && parseFloat(amount) !== parseFloat(contribution.amount)) {
            const member = await Member.findByPk(contribution.memberId);
            if (member) {
                const currentTotal = parseFloat(member.totalContributions) || 0;
                const oldAmount = parseFloat(contribution.amount);
                const newAmount = parseFloat(amount);
                await member.update({
                    totalContributions: currentTotal - oldAmount + newAmount
                });
            }
        }

        // Update contribution
        const updateData = {};
        if (amount) updateData.amount = amount;
        if (type) updateData.type = type;
        if (status) updateData.status = status;
        if (description !== undefined) updateData.description = description;

        await contribution.update(updateData);

        res.json({
            success: true,
            message: 'Contribution updated successfully',
            data: contribution
        });
    } catch (error) {
        console.error('Error updating contribution:', error);
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
        const contribution = await Contribution.findByPk(req.params.id);
        
        if (!contribution) {
            return res.status(404).json({
                success: false,
                message: 'Contribution not found'
            });
        }

        // Update member's total
        const member = await Member.findByPk(contribution.memberId);
        if (member) {
            const currentTotal = parseFloat(member.totalContributions) || 0;
            const contributionAmount = parseFloat(contribution.amount);
            await member.update({
                totalContributions: Math.max(0, currentTotal - contributionAmount)
            });
        }

        await contribution.destroy();

        res.json({
            success: true,
            message: 'Contribution deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contribution'
        });
    }
});

module.exports = router;

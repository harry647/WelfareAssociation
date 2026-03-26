/**
 * Withdrawal Routes
 * Handles withdrawal request endpoints
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Withdrawal = require('../models/Withdrawal');
const Member = require('../models/Member');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all withdrawals
router.get('/', auth, async (req, res) => {
    try {
        const { status, memberId, page = 1, limit = 10 } = req.query;
        const where = {};
        
        if (status) where.status = status;
        if (memberId) where.memberId = memberId;

        const withdrawals = await Withdrawal.findAndCountAll({
            where,
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ],
            order: [['requestDate', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            success: true,
            data: withdrawals.rows,
            pagination: {
                total: withdrawals.count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(withdrawals.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawals',
            error: error.message
        });
    }
});

// Get withdrawal summary
router.get('/summary', auth, async (req, res) => {
    try {
        const totalWithdrawn = await Withdrawal.sum('amount', {
            where: { status: 'approved' }
        }) || 0;

        const thisMonthWithdrawn = await Withdrawal.sum('amount', {
            where: {
                status: 'approved',
                processedDate: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }) || 0;

        const pendingCount = await Withdrawal.count({
            where: { status: 'pending' }
        });

        const approvedThisMonth = await Withdrawal.count({
            where: {
                status: 'approved',
                processedDate: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        const rejectedThisMonth = await Withdrawal.count({
            where: {
                status: 'rejected',
                processedDate: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        res.json({
            success: true,
            data: {
                totalWithdrawn,
                thisMonthWithdrawn,
                pendingCount,
                approvedThisMonth,
                rejectedThisMonth
            }
        });
    } catch (error) {
        console.error('Error fetching withdrawal summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal summary',
            error: error.message
        });
    }
});

// Get withdrawal by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findByPk(req.params.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ]
        });

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        res.json({
            success: true,
            data: withdrawal.get({ plain: true })
        });
    } catch (error) {
        console.error('Error fetching withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal',
            error: error.message
        });
    }
});

// Create new withdrawal request
router.post('/', auth, async (req, res) => {
    try {
        const { memberId, amount, reason } = req.body;

        // Validate member exists
        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(400).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Generate withdrawal number
        const withdrawalCount = await Withdrawal.count();
        const withdrawalNumber = `WTH/${String(withdrawalCount + 1).padStart(3, '0')}`;

        const withdrawal = await Withdrawal.create({
            memberId,
            withdrawalNumber,
            amount,
            reason,
            recordedBy: req.user.id
        });

        const withdrawalWithMember = await Withdrawal.findByPk(withdrawal.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: withdrawalWithMember.get({ plain: true }),
            message: 'Withdrawal request created successfully'
        });
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create withdrawal request',
            error: error.message
        });
    }
});

// Update withdrawal
router.put('/:id', auth, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findByPk(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        await withdrawal.update(req.body);

        const updatedWithdrawal = await Withdrawal.findByPk(req.params.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'studentId', 'email', 'phone']
                }
            ]
        });

        res.json({
            success: true,
            data: updatedWithdrawal.get({ plain: true }),
            message: 'Withdrawal updated successfully'
        });
    } catch (error) {
        console.error('Error updating withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update withdrawal',
            error: error.message
        });
    }
});

// Delete withdrawal
router.delete('/:id', auth, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findByPk(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        await withdrawal.destroy();

        res.json({
            success: true,
            message: 'Withdrawal deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete withdrawal',
            error: error.message
        });
    }
});

// Get pending withdrawals
router.get('/pending/list', auth, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ],
            order: [['requestDate', 'DESC']]
        });

        res.json({
            success: true,
            data: withdrawals
        });
    } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending withdrawals',
            error: error.message
        });
    }
});

// Approve withdrawal
router.post('/:id/approve', auth, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findByPk(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending withdrawals can be approved'
            });
        }

        const { approvalNotes, paymentMethod, paymentReference } = req.body;

        await withdrawal.update({
            status: 'approved',
            processedDate: new Date(),
            processedBy: req.user.id,
            approvalNotes,
            paymentMethod,
            paymentReference
        });

        const updatedWithdrawal = await Withdrawal.findByPk(req.params.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ]
        });

        res.json({
            success: true,
            data: updatedWithdrawal.get({ plain: true }),
            message: 'Withdrawal approved successfully'
        });
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve withdrawal',
            error: error.message
        });
    }
});

// Reject withdrawal
router.post('/:id/reject', auth, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findByPk(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending withdrawals can be rejected'
            });
        }

        const { approvalNotes } = req.body;

        await withdrawal.update({
            status: 'rejected',
            processedDate: new Date(),
            processedBy: req.user.id,
            approvalNotes
        });

        const updatedWithdrawal = await Withdrawal.findByPk(req.params.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'email', 'phone']
                }
            ]
        });

        res.json({
            success: true,
            data: updatedWithdrawal.get({ plain: true }),
            message: 'Withdrawal rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject withdrawal',
            error: error.message
        });
    }
});

// Get withdrawal summary
router.get('/summary/stats', auth, async (req, res) => {
    try {
        const totalWithdrawn = await Withdrawal.sum('amount', {
            where: { status: 'approved' }
        }) || 0;

        const thisMonthWithdrawn = await Withdrawal.sum('amount', {
            where: {
                status: 'approved',
                processedDate: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }) || 0;

        const pendingCount = await Withdrawal.count({
            where: { status: 'pending' }
        });

        const approvedThisMonth = await Withdrawal.count({
            where: {
                status: 'approved',
                processedDate: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        const rejectedThisMonth = await Withdrawal.count({
            where: {
                status: 'rejected',
                processedDate: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        res.json({
            success: true,
            data: {
                totalWithdrawn,
                thisMonthWithdrawn,
                pendingCount,
                approvedThisMonth,
                rejectedThisMonth
            }
        });
    } catch (error) {
        console.error('Error fetching withdrawal summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal summary',
            error: error.message
        });
    }
});

module.exports = router;

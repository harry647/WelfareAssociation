/**
 * Loan Routes
 * Handles loan applications and management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Loan = require('../models/Loan');
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
 * GET /api/loans
 * Get all loans (admin) or user's loans
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        // Non-admin users only see their own loans
        if (!['admin', 'treasurer'].includes(req.user.role)) {
            const member = await Member.findOne({ userId: req.user._id });
            if (member) {
                query.member = member._id;
            }
        }
        
        if (status) {
            query.status = status;
        }

        const loans = await Loan.find(query)
            .populate('member', 'firstName lastName memberNumber email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Loan.countDocuments(query);

        res.json({
            success: true,
            data: loans,
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
            message: 'Error fetching loans'
        });
    }
});

/**
 * GET /api/loans/pending
 * Get pending loan applications (admin)
 */
router.get('/pending', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const loans = await Loan.find({ status: 'pending' })
            .populate('member', 'firstName lastName memberNumber email phone')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: loans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending loans'
        });
    }
});

/**
 * GET /api/loans/statistics
 * Get loan statistics (admin)
 */
router.get('/statistics', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const totalLoans = await Loan.countDocuments();
        const pending = await Loan.countDocuments({ status: 'pending' });
        const active = await Loan.countDocuments({ status: 'active' });
        const overdue = await Loan.countDocuments({ status: 'overdue' });
        const completed = await Loan.countDocuments({ status: 'completed' });

        const totalAmount = await Loan.aggregate([
            { $match: { status: { $in: ['active', 'overdue'] } } },
            { $group: { _id: null, total: { $sum: '$principalAmount' } } }
        ]);

        const totalOutstanding = await Loan.aggregate([
            { $match: { status: { $in: ['active', 'overdue'] } } },
            { $group: { _id: null, total: { $sum: '$remainingBalance' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalLoans,
                pending,
                active,
                overdue,
                completed,
                totalDisbursed: totalAmount[0]?.total || 0,
                totalOutstanding: totalOutstanding[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching loan statistics'
        });
    }
});

/**
 * GET /api/loans/:id
 * Get loan by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate('member', 'firstName lastName memberNumber email phone')
            .populate('guarantors.member', 'firstName lastName memberNumber');

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Check permission
        const member = await Member.findOne({ userId: req.user._id });
        if (!['admin', 'treasurer'].includes(req.user.role) && 
            loan.member._id.toString() !== member?._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: loan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching loan'
        });
    }
});

/**
 * POST /api/loans/apply
 * Apply for a loan
 */
router.post('/apply', auth, [
    body('principalAmount').isNumeric().custom(val => val > 0),
    body('repaymentPeriod').isNumeric().custom(val => val > 0 && val <= 60),
    body('purpose').isIn(['education', 'business', 'emergency', 'personal', 'housing', 'medical', 'other']),
    validate
], async (req, res) => {
    try {
        const { principalAmount, repaymentPeriod, purpose, purposeDescription, guarantors } = req.body;

        // Get member
        const member = await Member.findOne({ userId: req.user._id });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member profile not found'
            });
        }

        // Check for existing active loans
        const existingLoan = await Loan.findOne({
            member: member._id,
            status: { $in: ['pending', 'active', 'overdue'] }
        });

        if (existingLoan) {
            return res.status(400).json({
                success: false,
                message: 'You have an active loan that needs to be settled first'
            });
        }

        // Calculate loan details
        const interestRate = 10;
        const interestAmount = (principalAmount * interestRate) / 100;
        const totalAmount = principalAmount + interestAmount;
        const monthlyPayment = totalAmount / repaymentPeriod;

        // Calculate due date
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + repaymentPeriod);

        // Create loan
        const loan = await Loan.create({
            member: member._id,
            principalAmount,
            interestRate,
            interestAmount,
            totalAmount,
            repaymentPeriod,
            monthlyPayment,
            dueDate,
            purpose,
            purposeDescription,
            guarantors: guarantors || [],
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Loan application submitted successfully',
            data: loan
        });
    } catch (error) {
        console.error('Loan application error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting loan application'
        });
    }
});

/**
 * PATCH /api/loans/:id/approve
 * Approve loan (admin)
 */
router.patch('/:id/approve', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Loan is not pending approval'
            });
        }

        loan.status = 'approved';
        loan.approvalDate = new Date();
        loan.approvedBy = req.user._id;
        
        // Disburse the loan (in real app, would transfer money)
        loan.disbursementDate = new Date();
        loan.status = 'active';
        
        await loan.save();

        res.json({
            success: true,
            message: 'Loan approved and disbursed',
            data: loan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving loan'
        });
    }
});

/**
 * PATCH /api/loans/:id/reject
 * Reject loan (admin)
 */
router.patch('/:id/reject', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Loan is not pending approval'
            });
        }

        loan.status = 'rejected';
        loan.rejectedBy = req.user._id;
        loan.rejectionReason = rejectionReason || 'Not specified';
        
        await loan.save();

        res.json({
            success: true,
            message: 'Loan rejected',
            data: loan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting loan'
        });
    }
});

/**
 * POST /api/loans/:id/payments
 * Record a loan payment
 */
router.post('/:id/payments', auth, async (req, res) => {
    try {
        const { amount, method, reference } = req.body;

        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Verify ownership
        const member = await Member.findOne({ userId: req.user._id });
        if (!['admin', 'treasurer'].includes(req.user.role) && 
            loan.member.toString() !== member?._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (loan.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Loan is already fully paid'
            });
        }

        // Add payment
        loan.payments.push({
            date: new Date(),
            amount,
            method,
            reference
        });

        loan.paidAmount += amount;
        loan.remainingBalance = loan.totalAmount - loan.paidAmount;

        // Check if fully paid
        if (loan.remainingBalance <= 0) {
            loan.status = 'completed';
            loan.remainingBalance = 0;
        }

        await loan.save();

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: loan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error recording payment'
        });
    }
});

/**
 * DELETE /api/loans/:id
 * Delete loan (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        await Loan.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Loan deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting loan'
        });
    }
});

module.exports = router;

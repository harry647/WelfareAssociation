/**
 * Loan Routes
 * Handles loan applications and management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const Fine = require('../models/Fine');
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
 * Calculate member eligibility score for loans
 * @param {string} memberId - Member ID
 * @returns {Object} Eligibility details
 */
async function calculateMemberScore(memberId) {
    try {
        const member = await Member.findByPk(memberId);
        if (!member) {
            throw new Error('Member not found');
        }

        // Get member's financial history
        const [contributions, fines, existingLoans] = await Promise.all([
            Contribution.findAll({ where: { memberId } }),
            Fine.findAll({ where: { memberId, status: 'unpaid' } }),
            Loan.findAll({ where: { memberId } })
        ]);

        // Calculate metrics
        const totalContributions = contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const unpaidFines = fines.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
        const membershipMonths = Math.max(1, Math.floor((new Date() - new Date(member.joinDate)) / (1000 * 60 * 60 * 24 * 30)));
        
        // Base score calculation
        let score = 0;
        let maxLoan = 500; // Base minimum
        
        // Contribution history (40% of score)
        if (totalContributions >= 10000) {
            score += 40;
            maxLoan += 5000;
        } else if (totalContributions >= 5000) {
            score += 30;
            maxLoan += 3000;
        } else if (totalContributions >= 2000) {
            score += 20;
            maxLoan += 1500;
        } else if (totalContributions >= 500) {
            score += 10;
            maxLoan += 500;
        }
        
        // Membership duration (30% of score)
        if (membershipMonths >= 12) {
            score += 30;
            maxLoan += 2000;
        } else if (membershipMonths >= 6) {
            score += 20;
            maxLoan += 1000;
        } else if (membershipMonths >= 3) {
            score += 10;
            maxLoan += 500;
        }
        
        // Loan history (20% of score)
        const completedLoans = existingLoans.filter(loan => loan.status === 'completed').length;
        const defaultedLoans = existingLoans.filter(loan => loan.status === 'defaulted').length;
        
        if (completedLoans >= 3 && defaultedLoans === 0) {
            score += 20;
            maxLoan += 3000;
        } else if (completedLoans >= 1 && defaultedLoans === 0) {
            score += 15;
            maxLoan += 2000;
        } else if (defaultedLoans > 0) {
            score -= 10;
            maxLoan = Math.max(500, maxLoan - 1000);
        }
        
        // Unpaid fines (10% of score)
        if (unpaidFines === 0) {
            score += 10;
        } else if (unpaidFines <= 500) {
            score += 5;
        } else {
            score -= 5;
            maxLoan = Math.max(500, maxLoan - unpaidFines);
        }
        
        // Generate reasons based on score
        const reasons = [];
        if (totalContributions < 500) reasons.push('Low contribution history');
        if (membershipMonths < 3) reasons.push('Recent member');
        if (unpaidFines > 0) reasons.push('Has unpaid fines');
        if (defaultedLoans > 0) reasons.push('Previous loan defaults');
        if (completedLoans === 0) reasons.push('No loan history');
        
        // Cap maximum loan
        maxLoan = Math.min(maxLoan, 50000);
        
        return {
            score: Math.max(0, Math.min(100, score)),
            maxLoan,
            reasons,
            loanCount: existingLoans.length,
            membershipMonths,
            totalContributions,
            unpaidFines
        };
    } catch (error) {
        console.error('Error calculating member score:', error);
        return {
            score: 0,
            maxLoan: 500,
            reasons: ['Unable to calculate eligibility'],
            loanCount: 0,
            membershipMonths: 0,
            totalContributions: 0,
            unpaidFines: 0
        };
    }
}

/**
 * GET /api/loans
 * Get all loans (admin) or user's loans
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const where = {};
        
        // Non-admin users only see their own loans
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) {
                where.memberId = member.id;
            }
        }
        
        if (status) {
            where.status = status;
        }

        const offset = (page - 1) * limit;
        const { count, rows: loans } = await Loan.findAndCountAll({
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
            data: loans || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching loans:', error);
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
router.get('/pending', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const loans = await Loan.findAll({
            where: { status: 'pending' },
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: loans
        });
    } catch (error) {
        console.error('Error fetching pending loans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending loans'
        });
    }
});

/**
 * GET /api/loans/eligibility
 * Get member's loan eligibility based on score system
 * NOTE: This route must be defined BEFORE /:id to avoid 'eligibility' being treated as an ID
 */
router.get('/eligibility', auth, async (req, res) => {
    try {
        // Handle admin user case - admin cannot apply for loans
        if (req.user.id === 'admin') {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    maxLoan: 0,
                    score: 0,
                    message: 'Admin accounts are not eligible for loans',
                    reasons: [],
                    loanCount: 0,
                    restrictions: {}
                }
            });
        }
        
        // Get member
        const member = await Member.findOne({ where: { userId: req.user.id } });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member profile not found'
            });
        }
        
        // Calculate eligibility
        const eligibility = await calculateMemberScore(member.id);
        
        // Check restrictions
        const activeLoan = await Loan.findOne({
            where: {
                memberId: member.id,
                status: { [Op.in]: ['pending', 'active', 'overdue'] }
            }
        });
        
        const canApply = !activeLoan && eligibility.maxLoan >= 500;
        
        res.json({
            success: true,
            data: {
                eligible: canApply,
                maxLoan: eligibility.maxLoan,
                score: eligibility.score,
                reasons: eligibility.reasons,
                loanCount: eligibility.loanCount,
                membershipMonths: eligibility.membershipMonths,
                totalContributions: eligibility.totalContributions,
                unpaidFines: eligibility.unpaidFines,
                restrictions: {
                    hasActiveLoan: !!activeLoan,
                    message: activeLoan ? 'You have an active loan that needs to be settled first' : null
                }
            }
        });
    } catch (error) {
        console.error('Error calculating loan eligibility:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating loan eligibility'
        });
    }
});

/**
 * GET /api/loans/statistics
 * Get loan statistics (admin)
 */
router.get('/statistics', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const totalLoans = await Loan.count();
        const pending = await Loan.count({ where: { status: 'pending' } });
        const active = await Loan.count({ where: { status: 'active' } });
        const overdue = await Loan.count({ where: { status: 'overdue' } });
        const completed = await Loan.count({ where: { status: 'completed' } });
        
        const totalDisbursed = await Loan.sum('principalAmount', {
            where: { status: { [Op.in]: ['active', 'overdue'] } }
        }) || 0;
        
        const totalOutstanding = await Loan.sum('remainingBalance', {
            where: { status: { [Op.in]: ['active', 'overdue'] } }
        }) || 0;

        res.json({
            success: true,
            data: {
                totalLoans,
                pending,
                active,
                overdue,
                completed,
                totalDisbursed,
                totalOutstanding
            }
        });
    } catch (error) {
        console.error('Error fetching loan statistics:', error);
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
        const loan = await Loan.findByPk(req.params.id, {
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ]
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Check permission (admin/treasurer can view all, members can only view their own)
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (!member || loan.memberId !== member.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.json({
            success: true,
            data: loan
        });
    } catch (error) {
        console.error('Error fetching loan:', error);
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
        const member = await Member.findOne({ where: { userId: req.user.id } });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member profile not found'
            });
        }

        // Check for existing active loans
        const existingLoan = await Loan.findOne({
            where: {
                memberId: member.id,
                status: { [Op.in]: ['pending', 'active', 'overdue'] }
            }
        });

        if (existingLoan) {
            return res.status(400).json({
                success: false,
                message: 'You have an active loan that needs to be settled first'
            });
        }

        // Calculate eligibility to validate requested amount
        const eligibility = await calculateMemberScore(member.id);
        
        // Validate requested amount against eligibility
        if (parseFloat(principalAmount) > eligibility.maxLoan) {
            return res.status(400).json({
                success: false,
                message: `The requested amount exceeds your maximum loan limit of Ksh ${eligibility.maxLoan.toLocaleString()}`,
                data: {
                    maxLoan: eligibility.maxLoan,
                    requestedAmount: principalAmount,
                    score: eligibility.score,
                    reasons: eligibility.reasons
                }
            });
        }

        // Check for unpaid fines - can still apply but warn
        const unpaidFines = await Fine.sum('amount', {
            where: { 
                memberId: member.id,
                status: 'unpaid'
            }
        }) || 0;

        // Calculate loan details
        const interestRate = 10;
        const interestAmount = (principalAmount * interestRate) / 100;
        const totalAmount = parseFloat(principalAmount) + parseFloat(interestAmount);
        const monthlyPayment = totalAmount / repaymentPeriod;

        // Calculate due date
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + repaymentPeriod);

        // Generate loan number
        const loanCount = await Loan.count() + 1;
        const loanNumber = `LN${String(loanCount).padStart(6, '0')}`;

        // Create loan
        const loan = await Loan.create({
            memberId: member.id,
            loanNumber,
            principalAmount,
            interestRate,
            interestAmount,
            totalAmount,
            repaymentPeriod,
            monthlyPayment,
            remainingBalance: totalAmount,
            dueDate,
            purpose,
            purposeDescription,
            guarantors: guarantors || [],
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Loan application submitted successfully',
            data: {
                loan,
                eligibility: {
                    maxLoan: eligibility.maxLoan,
                    score: eligibility.score,
                    reasons: eligibility.reasons
                },
                warnings: unpaidFines > 0 ? [`You have unpaid fines of Ksh ${unpaidFines.toLocaleString()}`] : []
            }
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
router.patch('/:id/approve', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const loan = await Loan.findByPk(req.params.id);
        
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
        loan.approvedBy = req.user.id;
        
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
        console.error('Error approving loan:', error);
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
router.patch('/:id/reject', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        
        const loan = await Loan.findByPk(req.params.id);
        
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
        loan.rejectedBy = req.user.id;
        loan.rejectionReason = rejectionReason || 'Not specified';
        
        await loan.save();

        res.json({
            success: true,
            message: 'Loan rejected',
            data: loan
        });
    } catch (error) {
        console.error('Error rejecting loan:', error);
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

        const loan = await Loan.findByPk(req.params.id, {
            include: [{ model: Member, as: 'member' }]
        });
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Verify ownership
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (!member || loan.memberId !== member.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        if (loan.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Loan is already fully paid'
            });
        }

        // Parse existing payments or create new array
        const payments = typeof loan.payments === 'string' ? JSON.parse(loan.payments) : (loan.payments || []);
        payments.push({
            date: new Date(),
            amount: parseFloat(amount),
            method,
            reference
        });

        loan.paidAmount = (parseFloat(loan.paidAmount) || 0) + parseFloat(amount);
        loan.remainingBalance = parseFloat(loan.totalAmount) - loan.paidAmount;
        loan.payments = payments;

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
        console.error('Error recording payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording payment'
        });
    }
});

/**
 * DELETE /api/loans/:id
 * Delete loan (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const loan = await Loan.findByPk(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }
        
        await loan.destroy();
        
        res.json({
            success: true,
            message: 'Loan deleted'
        });
    } catch (error) {
        console.error('Error deleting loan:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting loan'
        });
    }
});

module.exports = router;

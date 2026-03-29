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
        console.log('Calculating score for member:', memberId);
        
        const member = await Member.findByPk(memberId);
        if (!member) {
            console.error('Member not found:', memberId);
            throw new Error('Member not found');
        }
        
        console.log('Member found:', { id: member.id, joinDate: member.joinDate });

        // Get member's financial history with error handling
        let contributions, fines, existingLoans;
        try {
            [contributions, fines, existingLoans] = await Promise.all([
                Contribution.findAll({ where: { memberId } }),
                Fine.findAll({ where: { memberId, status: 'unpaid' } }),
                Loan.findAll({ where: { memberId } })
            ]);
        } catch (dbError) {
            console.error('Database query error:', dbError);
            throw new Error('Failed to retrieve financial history');
        }
        
        console.log('Financial data loaded:', { 
            contributionsCount: contributions.length, 
            finesCount: fines.length, 
            loansCount: existingLoans.length 
        });

        // Calculate metrics with error handling
        let totalContributions, unpaidFines, membershipMonths;
        try {
            totalContributions = contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            unpaidFines = fines.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
            membershipMonths = member.joinDate ? 
                Math.max(1, Math.floor((new Date() - new Date(member.joinDate)) / (1000 * 60 * 60 * 24 * 30))) : 
                1;
            
            console.log('Calculated metrics:', { totalContributions, unpaidFines, membershipMonths });
        } catch (calcError) {
            console.error('Error calculating metrics:', calcError);
            throw new Error('Failed to calculate eligibility metrics');
        }
        
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
        console.log('=== Eligibility Check Started ===');
        console.log('User:', { id: req.user.id, role: req.user.role });
        
        // Note: Database access is via Sequelize models (Loan, Member, Contribution, Fine)
        // imported at the top of this file
        
        // Handle admin user case - admin cannot apply for loans
        if (req.user.id === 'admin') {
            console.log('Admin user detected, returning ineligible');
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
        console.log('Looking up member for userId:', req.user.id);
        const member = await Member.findOne({ where: { userId: req.user.id } });
        if (!member) {
            console.error('Member not found for userId:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'Member profile not found'
            });
        }
        
        console.log('Member found:', { id: member.id, userId: member.userId, joinDate: member.joinDate });
        
        // Calculate eligibility
        console.log('Calculating eligibility for member:', member.id);
        const eligibility = await calculateMemberScore(member.id);
        console.log('Eligibility calculated:', eligibility);
        
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
 * GET /api/loans/guarantor-requests
 * Get loans where current user is a guarantor with pending response
 */
router.get('/guarantor-requests', auth, async (req, res) => {
    try {
        // Handle admin user - admin cannot be a guarantor
        if (req.user.id === 'admin' || req.user.role === 'admin') {
            return res.json({ success: true, data: [] });
        }
        
        // Find member for this user
        const member = await Member.findOne({ where: { userId: req.user.id } });
        
        if (!member) {
            return res.json({ success: true, data: [] });
        }
        
        // Find loans where this member is in guarantors array and status is pending
        const loans = await Loan.findAll({
            where: {
                status: { [Op.in]: ['pending', 'approved'] },
                guarantorStatus: 'pending'
            }
        });
        
        // Filter to loans where this member is a guarantor
        const guarantorLoans = loans.filter(loan => {
            const guarantors = loan.guarantors || [];
            return guarantors.some(g => 
                g.memberId === member.id || 
                g.memberNumber === member.memberNumber ||
                g.studentId === member.memberNumber
            );
        });
        
        // Get member details for response
        const memberLoans = await Promise.all(guarantorLoans.map(async loan => {
            const loanMember = await Member.findByPk(loan.memberId);
            return {
                id: loan.id,
                loanNumber: loan.loanNumber,
                amount: loan.principalAmount,
                memberName: loanMember ? `${loanMember.firstName} ${loanMember.lastName}` : 'Unknown',
                memberNumber: loanMember?.memberNumber,
                status: loan.guarantorStatus,
                createdAt: loan.createdAt
            };
        }));
        
        res.json({ success: true, data: memberLoans });
    } catch (error) {
        console.error('Guarantor requests error:', error);
        res.status(500).json({ success: false, message: 'Error fetching guarantor requests' });
    }
});

/**
 * PUT /api/loans/:id/guarantor-response
 * guarantor accepts or rejects a loan request
 */
router.put('/:id/guarantor-response', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body; // action: 'accept' or 'reject'
        
        const loan = await Loan.findByPk(id);
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        
        // Get guarantor info from loan
        const guarantors = loan.guarantors || [];
        const guarantor = guarantors.find(g => g.memberId === req.user.id || g.userId === req.user.id);
        
        if (!guarantor) {
            return res.status(403).json({ success: false, message: 'You are not a guarantor for this loan' });
        }
        
        // Update guarantor status
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        loan.guarantorStatus = newStatus;
        loan.guarantorResponseDate = new Date();
        loan.guarantorResponseNote = note || null;
        await loan.save();
        
        // Create notification for loan member
        const member = await Member.findByPk(loan.memberId);
        if (member && member.userId) {
            const { Notice } = require('../models');
            await Notice.create({
                memberId: loan.memberId,
                userId: member.userId,
                title: `Guarantor ${action === 'accept' ? 'Accepted' : 'Rejected'} Your Loan`,
                message: `Your guarantor ${guarantor.name} has ${newStatus} your loan request (${loan.loanNumber}). ${
                    action === 'accept' 
                        ? 'The loan will be processed once admin approves disbursement.'
                        : 'Please find another guarantor or contact admin.'
                }`,
                type: 'loan',
                priority: 'high'
            });
        }
        
        res.json({ success: true, message: `You have ${newStatus} the loan request` });
    } catch (error) {
        console.error('Guarantor response error:', error);
        res.status(500).json({ success: false, message: 'Error processing response' });
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
 * Get loan by ID or loanNumber
 */
router.get('/:id', auth, async (req, res) => {
    try {
        // Validate if the ID looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(req.params.id);
        
        let loan;
        
        if (isUuid) {
            // If it's a UUID, find directly by ID with include
            loan = await Loan.findByPk(req.params.id, {
                include: [
                    { 
                        model: Member, 
                        as: 'member', 
                        attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                    }
                ]
            });
        } else {
            // Otherwise try to find by loanNumber
            loan = await Loan.findOne({
                where: { loanNumber: req.params.id },
                include: [
                    { 
                        model: Member, 
                        as: 'member', 
                        attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                    }
                ]
            });
        }
        
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
        console.log('=== Loan Application Started ===');
        console.log('Request body:', req.body);
        console.log('User:', { id: req.user.id, role: req.user.role });
        
        const { principalAmount, repaymentPeriod, purpose, purposeDescription, guarantors } = req.body;
        
        console.log('Parsed loan data:', { 
            principalAmount, 
            repaymentPeriod, 
            purpose, 
            purposeDescription, 
            guarantorsCount: guarantors?.length || 0 
        });

        // Get member
        console.log('Looking up member for userId:', req.user.id);
        const member = await Member.findOne({ where: { userId: req.user.id } });
        if (!member) {
            console.error('Member not found for userId:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'Member profile not found'
            });
        }
        
        console.log('Member found:', { id: member.id, userId: member.userId, name: `${member.firstName} ${member.lastName}` });

        // Check for existing active loans
        const existingLoan = await Loan.findOne({
            where: {
                memberId: member.id,
                status: { [Op.in]: ['pending', 'active', 'overdue'] }
            }
        });

        if (existingLoan) {
            console.log('Active loan found, rejecting application:', existingLoan.loanNumber);
            return res.status(400).json({
                success: false,
                message: 'You have an active loan that needs to be settled first'
            });
        }

        console.log('No active loans found, proceeding with eligibility check');

        // Calculate eligibility to validate requested amount
        const eligibility = await calculateMemberScore(member.id);
        console.log('Eligibility calculated:', eligibility);
        
        // Validate requested amount against eligibility
        if (parseFloat(principalAmount) > eligibility.maxLoan) {
            console.log('Amount exceeds limit:', { requested: principalAmount, maxAllowed: eligibility.maxLoan });
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

        console.log('Amount validation passed');

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
        
        console.log('Creating loan with data:', {
            memberId: member.id,
            loanNumber,
            principalAmount,
            interestRate,
            totalAmount,
            repaymentPeriod,
            monthlyPayment,
            dueDate,
            purpose,
            guarantorStatus: guarantors?.length > 0 ? 'pending' : 'not_required'
        });

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
            guarantorStatus: guarantors?.length > 0 ? 'pending' : 'not_required',
            status: 'pending'
        });
        
        console.log('Loan created successfully:', { id: loan.id, loanNumber: loan.loanNumber });
        
        // Notify guarantors if any were provided
        if (guarantors && guarantors.length > 0) {
            const { Notice, Member, User } = require('../models');
            for (const guarantor of guarantors) {
                // Find the guarantor member
                const guarantorMember = await Member.findOne({ 
                    where: { memberNumber: guarantor.studentId } 
                });
                if (guarantorMember && guarantorMember.userId) {
                    await Notice.create({
                        memberId: guarantorMember.id,
                        userId: guarantorMember.userId,
                        title: 'Guarantor Request - Action Required',
                        content: `${member.firstName} ${member.lastName} has selected you as a guarantor for their loan request (${loan.loanNumber}) of Ksh ${principalAmount}. Please log in to the member portal to accept or reject this request.`,
                        type: 'reminder',
                        priority: 'high',
                        author: req.user.id,
                        isPublished: true,
                        audience: 'members'
                    });
                }
            }
        }

        console.log('Sending success response:', { 
            loanId: loan.id, 
            loanNumber: loan.loanNumber,
            warnings: unpaidFines > 0 ? [`You have unpaid fines of Ksh ${unpaidFines.toLocaleString()}`] : []
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
        console.error('=== Loan Application Error ===');
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Check if it's a validation error
        const statusCode = error.name === 'SequelizeValidationError' ? 400 : 500;
        
        res.status(500).json({
            success: false,
            message: 'Failed to submit loan application',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PATCH /api/loans/:id/approve
 * Approve loan (admin)
 */
router.patch('/:id/approve', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        // Validate if the ID looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(req.params.id);
        
        let loan;
        
        if (isUuid) {
            loan = await Loan.findByPk(req.params.id);
        } else {
            loan = await Loan.findOne({ where: { loanNumber: req.params.id } });
        }
        
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
        // Only set approvedBy if it's a valid UUID (not admin user)
        loan.approvedBy = req.user.id === 'admin' ? null : req.user.id;
        
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
        
        // Validate if the ID looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(req.params.id);
        
        let loan;
        
        if (isUuid) {
            loan = await Loan.findByPk(req.params.id);
        } else {
            loan = await Loan.findOne({ where: { loanNumber: req.params.id } });
        }
        
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
        // Only set rejectedBy if it's a valid UUID (not admin user)
        loan.rejectedBy = req.user.id === 'admin' ? null : req.user.id;
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
        
        // Validate if the ID looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(req.params.id);
        
        let loan;
        
        if (isUuid) {
            loan = await Loan.findByPk(req.params.id, {
                include: [{ model: Member, as: 'member' }]
            });
        } else {
            loan = await Loan.findOne({
                where: { loanNumber: req.params.id },
                include: [{ model: Member, as: 'member' }]
            });
        }
        
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

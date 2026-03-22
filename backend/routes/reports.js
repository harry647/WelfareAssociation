/**
 * Report Routes
 * Handles report generation and management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const Contribution = require('../models/Contribution');
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Debt = require('../models/Debt');
const Bereavement = require('../models/Bereavement');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/reports
 * Get all reports
 */
router.get('/', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10 } = req.query;
        let query = {};

        if (type) query.type = type;
        if (status) query.status = status;

        const reports = await Report.find(query)
            .populate('generatedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(query);

        res.json({
            success: true,
            data: reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching reports' });
    }
});

/**
 * GET /api/reports/templates
 * Get report templates
 */
router.get('/templates', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const templates = [
            { id: 1, name: 'Monthly Contribution Summary', type: 'contribution', description: 'Summary of all contributions for a month' },
            { id: 2, name: 'Loan Status Report', type: 'loan', description: 'Overview of all loan statuses' },
            { id: 3, name: 'Member Growth Report', type: 'membership', description: 'Track member registration and attrition' },
            { id: 4, name: 'Financial Summary', type: 'financial', description: 'Overall financial status' },
            { id: 5, name: 'Bereavement Support Report', type: 'bereavement', description: 'Bereavement cases and contributions' }
        ];

        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching templates' });
    }
});

/**
 * GET /api/reports/:id
 * Get report by ID
 */
router.get('/:id', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('generatedBy', 'firstName lastName email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Increment view count
        report.viewCount += 1;
        await report.save();

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching report' });
    }
});

/**
 * GET /api/reports/type/:type
 * Get reports by type
 */
router.get('/type/:type', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { type: req.params.type };

        const reports = await Report.find(query)
            .populate('generatedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(query);

        res.json({
            success: true,
            data: reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching reports by type' });
    }
});

/**
 * POST /api/reports/generate
 * Generate a new report
 */
router.post('/generate', auth, authorize('admin', 'treasurer'), [
    body('name').notEmpty().withMessage('Report name is required'),
    body('type').notEmpty().withMessage('Report type is required')
], validate, async (req, res) => {
    try {
        const { name, type, description, parameters } = req.body;

        const report = new Report({
            name,
            type,
            description: description || '',
            generatedBy: req.user._id,
            parameters: parameters || {},
            status: 'processing'
        });

        // Generate report data based on type
        let reportData = {};

        switch (type) {
            case 'contribution':
                reportData = await generateContributionReport(parameters);
                break;
            case 'loan':
                reportData = await generateLoanReport(parameters);
                break;
            case 'membership':
                reportData = await generateMembershipReport(parameters);
                break;
            case 'bereavement':
                reportData = await generateBereavementReport(parameters);
                break;
            case 'financial':
                reportData = await generateFinancialReport(parameters);
                break;
            default:
                reportData = { message: 'Generic report' };
        }

        report.data = reportData;
        report.status = 'completed';
        await report.save();

        res.status(201).json({
            success: true,
            message: 'Report generated successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
});

/**
 * GET /api/reports/contributions
 * Get contribution report data
 */
router.get('/contributions', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const contributions = await Contribution.find(query)
            .populate('member', 'firstName lastName memberNumber')
            .sort({ createdAt: -1 });

        const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);

        res.json({
            success: true,
            data: {
                contributions,
                summary: {
                    total: contributions.length,
                    totalAmount,
                    averageAmount: contributions.length > 0 ? totalAmount / contributions.length : 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching contribution report' });
    }
});

/**
 * GET /api/reports/loans
 * Get loan report data
 */
router.get('/loans', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (status) query.status = status;

        const loans = await Loan.find(query)
            .populate('member', 'firstName lastName memberNumber')
            .sort({ createdAt: -1 });

        const totalDisbursed = loans.filter(l => l.status === 'approved' || l.status === 'active')
            .reduce((sum, l) => sum + (l.principal || 0), 0);

        res.json({
            success: true,
            data: {
                loans,
                summary: {
                    total: loans.length,
                    pending: loans.filter(l => l.status === 'pending').length,
                    approved: loans.filter(l => l.status === 'approved').length,
                    active: loans.filter(l => l.status === 'active').length,
                    rejected: loans.filter(l => l.status === 'rejected').length,
                    totalDisbursed
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching loan report' });
    }
});

/**
 * GET /api/reports/bereavement
 * Get bereavement report data
 */
router.get('/bereavement', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const cases = await Bereavement.find()
            .populate('member', 'firstName lastName memberNumber')
            .sort({ createdAt: -1 });

        const totalContributions = cases.reduce((sum, c) => sum + (c.totalContributions || 0), 0);

        res.json({
            success: true,
            data: {
                cases,
                summary: {
                    total: cases.length,
                    active: cases.filter(c => c.status === 'active').length,
                    closed: cases.filter(c => c.status === 'closed').length,
                    totalContributions
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bereavement report' });
    }
});

/**
 * GET /api/reports/membership
 * Get membership report data
 */
router.get('/membership', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (status) query.status = status;

        const members = await Member.find(query).sort({ createdAt: -1 });

        const activeCount = members.filter(m => m.status === 'active').length;
        const inactiveCount = members.filter(m => m.status === 'inactive').length;

        res.json({
            success: true,
            data: {
                members,
                summary: {
                    total: members.length,
                    active: activeCount,
                    inactive: inactiveCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching membership report' });
    }
});

/**
 * DELETE /api/reports/:id
 * Delete report
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting report' });
    }
});

// Helper functions for report generation
async function generateContributionReport(parameters) {
    const { startDate, endDate } = parameters || {};
    const query = {};
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const contributions = await Contribution.find(query)
        .populate('member', 'firstName lastName memberNumber');
    
    const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);

    return {
        contributions,
        summary: {
            total: contributions.length,
            totalAmount,
            averageAmount: contributions.length > 0 ? totalAmount / contributions.length : 0
        }
    };
}

async function generateLoanReport(parameters) {
    const { status } = parameters || {};
    const query = status ? { status } : {};

    const loans = await Loan.find(query)
        .populate('member', 'firstName lastName memberNumber');

    return {
        loans,
        summary: {
            total: loans.length,
            pending: loans.filter(l => l.status === 'pending').length,
            approved: loans.filter(l => l.status === 'approved').length,
            active: loans.filter(l => l.status === 'active').length
        }
    };
}

async function generateMembershipReport(parameters) {
    const members = await Member.find().sort({ createdAt: -1 });
    
    return {
        members,
        summary: {
            total: members.length,
            active: members.filter(m => m.status === 'active').length,
            inactive: members.filter(m => m.status === 'inactive').length
        }
    };
}

async function generateBereavementReport(parameters) {
    const cases = await Bereavement.find()
        .populate('member', 'firstName lastName memberNumber');

    return {
        cases,
        summary: {
            total: cases.length,
            active: cases.filter(c => c.status === 'active').length,
            totalContributions: cases.reduce((sum, c) => sum + (c.totalContributions || 0), 0)
        }
    };
}

async function generateFinancialReport(parameters) {
    const contributions = await Contribution.find();
    const loans = await Loan.find({ status: { $in: ['approved', 'active'] } });
    const debts = await Debt.find({ status: 'pending' });

    return {
        summary: {
            totalContributions: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
            totalLoansDisbursed: loans.reduce((sum, l) => sum + (l.principal || 0), 0),
            totalOutstandingDebts: debts.reduce((sum, d) => sum + (d.amount || 0), 0)
        }
    };
}

module.exports = router;

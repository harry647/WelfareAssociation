/**
 * Report Routes
 * Handles report generation and management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const Contribution = require('../models/Contribution');
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Debt = require('../models/Debt');
const Bereavement = require('../models/Bereavement');
const { auth, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

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
        let where = {};

        if (type) where.type = type;
        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { count, rows: reports } = await Report.findAndCountAll({
            where,
            include: [
                { model: User, as: 'generator', attributes: ['firstName', 'lastName', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: reports || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
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
        const report = await Report.findByPk(req.params.id, {
            include: [
                { model: User, as: 'generator', attributes: ['firstName', 'lastName', 'email'] }
            ]
        });

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
        const where = { type: req.params.type };

        const offset = (page - 1) * limit;
        const { count, rows: reports } = await Report.findAndCountAll({
            where,
            include: [
                { model: User, as: 'generator', attributes: ['firstName', 'lastName', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: reports || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
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
            generatedBy: req.user.id,
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
        const { startDate, endDate, limit } = req.query;
        const where = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const contributions = await Contribution.findAll({
            where,
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit ? parseInt(limit) : undefined
        });

        const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        res.json({
            success: true,
            data: {
                contributions: contributions || [],
                summary: {
                    total: contributions?.length || 0,
                    totalAmount: totalAmount || 0,
                    averageAmount: contributions?.length > 0 ? totalAmount / contributions.length : 0
                }
            },
            message: contributions?.length === 0 ? 'No contribution records found' : null
        });
    } catch (error) {
        console.error('Error fetching contribution report:', error);
        res.status(500).json({ success: false, message: 'Error fetching contribution report' });
    }
});

/**
 * GET /api/reports/loans
 * Get loan report data
 */
router.get('/loans', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { startDate, endDate, status, limit } = req.query;
        const where = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }
        if (status) where.status = status;

        const loans = await Loan.findAll({
            where,
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit ? parseInt(limit) : undefined
        });

        const totalDisbursed = loans?.filter(l => l.status === 'approved' || l.status === 'active')
            .reduce((sum, l) => sum + parseFloat(l.principalAmount || 0), 0) || 0;

        res.json({
            success: true,
            data: {
                loans: loans || [],
                summary: {
                    total: loans?.length || 0,
                    pending: loans?.filter(l => l.status === 'pending').length || 0,
                    approved: loans?.filter(l => l.status === 'approved').length || 0,
                    active: loans?.filter(l => l.status === 'active').length || 0,
                    rejected: loans?.filter(l => l.status === 'rejected').length || 0,
                    totalDisbursed: totalDisbursed || 0
                }
            },
            message: loans?.length === 0 ? 'No loan records found' : null
        });
    } catch (error) {
        console.error('Error fetching loan report:', error);
        res.status(500).json({ success: false, message: 'Error fetching loan report' });
    }
});

/**
 * GET /api/reports/bereavement
 * Get bereavement report data
 */
router.get('/bereavement', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const cases = await Bereavement.findAll({
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const totalContributions = cases?.reduce((sum, c) => sum + parseFloat(c.totalContributions || 0), 0) || 0;

        res.json({
            success: true,
            data: {
                cases: cases || [],
                summary: {
                    total: cases?.length || 0,
                    active: cases?.filter(c => c.status === 'active').length || 0,
                    closed: cases?.filter(c => c.status === 'closed').length || 0,
                    totalContributions: totalContributions || 0
                }
            },
            message: cases?.length === 0 ? 'No bereavement cases found' : null
        });
    } catch (error) {
        console.error('Error fetching bereavement report:', error);
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
        const where = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }
        if (status) where.membershipStatus = status;

        const members = await Member.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        const activeCount = members?.filter(m => m.membershipStatus === 'active').length || 0;
        const inactiveCount = members?.filter(m => m.membershipStatus === 'inactive').length || 0;

        res.json({
            success: true,
            data: {
                members: members || [],
                summary: {
                    total: members?.length || 0,
                    active: activeCount,
                    inactive: inactiveCount
                }
            },
            message: members?.length === 0 ? 'No member records found' : null
        });
    } catch (error) {
        console.error('Error fetching membership report:', error);
        res.status(500).json({ success: false, message: 'Error fetching membership report' });
    }
});

/**
 * GET /api/reports/export
 * Export report data
 */
router.get('/export', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { type, format = 'json', startDate, endDate } = req.query;
        
        let data = {};
        let reportName = '';
        
        switch (type) {
            case 'contributions':
                reportName = 'Contributions Report';
                const contribWhere = {};
                if (startDate || endDate) {
                    contribWhere.createdAt = {};
                    if (startDate) contribWhere.createdAt[Op.gte] = new Date(startDate);
                    if (endDate) contribWhere.createdAt[Op.lte] = new Date(endDate);
                }
                const contributions = await Contribution.findAll({
                    where: contribWhere,
                    include: [
                        { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
                    ]
                });
                data.contributions = contributions || [];
                data.summary = {
                    total: contributions?.length || 0,
                    totalAmount: contributions?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0
                };
                break;
                
            case 'loans':
                reportName = 'Loans Report';
                const loanWhere = {};
                if (startDate || endDate) {
                    loanWhere.createdAt = {};
                    if (startDate) loanWhere.createdAt[Op.gte] = new Date(startDate);
                    if (endDate) loanWhere.createdAt[Op.lte] = new Date(endDate);
                }
                const loans = await Loan.findAll({
                    where: loanWhere,
                    include: [
                        { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
                    ]
                });
                data.loans = loans || [];
                data.summary = {
                    total: loans?.length || 0,
                    pending: loans?.filter(l => l.status === 'pending').length || 0,
                    active: loans?.filter(l => l.status === 'active').length || 0,
                    totalDisbursed: loans?.filter(l => l.status === 'active').reduce((sum, l) => sum + parseFloat(l.principalAmount || 0), 0) || 0
                };
                break;
                
            case 'membership':
                reportName = 'Membership Report';
                const members = await Member.findAll();
                data.members = members || [];
                data.summary = {
                    total: members?.length || 0,
                    active: members?.filter(m => m.membershipStatus === 'active').length || 0,
                    inactive: members?.filter(m => m.membershipStatus === 'inactive').length || 0
                };
                break;
                
            case 'bereavement':
                reportName = 'Bereavement Report';
                const cases = await Bereavement.findAll({
                    include: [
                        { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber'] }
                    ]
                });
                data.cases = cases || [];
                data.summary = {
                    total: cases?.length || 0,
                    active: cases?.filter(c => c.status === 'active').length || 0,
                    totalContributions: cases?.reduce((sum, c) => sum + parseFloat(c.totalContributions || 0), 0) || 0
                };
                break;
                
            default:
                return res.status(400).json({ success: false, message: 'Invalid report type' });
        }
        
        if (format === 'csv') {
            let csv = '';
            if (type === 'contributions') {
                csv = 'Member,Amount,Date,Method\n';
                data.contributions.forEach(c => {
                    csv += `${c.member?.firstName} ${c.member?.lastName},${c.amount},${c.createdAt},${c.paymentMethod}\n`;
                });
            } else if (type === 'loans') {
                csv = 'Member,Principal,Status,Date\n';
                data.loans.forEach(l => {
                    csv += `${l.member?.firstName} ${l.member?.lastName},${l.principalAmount},${l.status},${l.createdAt}\n`;
                });
            } else if (type === 'membership') {
                csv = 'Name,Email,Status,Joined Date\n';
                data.members.forEach(m => {
                    csv += `${m.firstName} ${m.lastName},${m.email},${m.membershipStatus},${m.joinDate}\n`;
                });
            }
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${reportName.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            return res.send(csv);
        }
        
        res.json({
            success: true,
            reportName,
            generatedAt: new Date().toISOString(),
            data,
            message: (data[type]?.length || 0) === 0 ? `No ${type} records found` : null
        });
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ success: false, message: 'Error exporting report' });
    }
});

/**
 * POST /api/reports/schedule
 * Schedule automated report generation
 */
router.post('/schedule', auth, authorize('admin', 'treasurer'), [
    body('type').notEmpty().withMessage('Report type is required'),
    body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Valid frequency is required')
], validate, async (req, res) => {
    try {
        const { type, frequency, recipients, parameters } = req.body;
        
        const schedule = {
            id: Date.now().toString(),
            type,
            frequency,
            recipients: recipients || [],
            parameters: parameters || {},
            nextRun: calculateNextRun(frequency),
            createdBy: req.user.id,
            createdAt: new Date(),
            isActive: true
        };
        
        res.status(201).json({
            success: true,
            message: 'Report schedule created successfully',
            data: schedule
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating report schedule' });
    }
});

/**
 * GET /api/reports/schedules
 * Get all scheduled reports
 */
router.get('/schedules', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        res.json({
            success: true,
            data: [],
            message: 'No scheduled reports found'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching schedules' });
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
function calculateNextRun(frequency) {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
    }
    
    return next;
}

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

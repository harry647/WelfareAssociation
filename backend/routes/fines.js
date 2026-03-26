/**
 * Fine Routes
 * Handles fines management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Fine = require('../models/Fine');
const Member = require('../models/Member');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Default fine types (in production, store in database)
const DEFAULT_FINE_TYPES = [
    { code: 'MISSED_MEETING', name: 'Missed Meeting', amount: 200, category: 'attendance' },
    { code: 'LATE_MEETING', name: 'Late to Meeting', amount: 50, category: 'attendance' },
    { code: 'SPEAKING_WITHOUT_PERMISSION', name: 'Speaking Without Permission', amount: 20, category: 'conduct' },
    { code: 'NOT_WRITING_SHARES', name: 'Not Writing Shares', amount: 100, category: 'contributions' },
    { code: 'LATE_PAYMENT', name: 'Late Payment', amount: 500, category: 'payments' },
    { code: 'MISSING_EVENT', name: 'Missing Event', amount: 1000, category: 'attendance' },
    { code: 'MISSING_REPORT', name: 'Missing Report', amount: 750, category: 'administrative' },
    { code: 'POLICY_VIOLATION', name: 'Policy Violation', amount: 2000, category: 'conduct' }
];

/**
 * GET /api/fines/types
 * Get fine types
 */
router.get('/types', (req, res) => {
    res.json({ success: true, data: DEFAULT_FINE_TYPES });
});

/**
 * GET /api/fines
 * Get all fines
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, memberId, page = 1, limit = 10 } = req.query;
        const where = {};

        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) {
                where.memberId = member.id;
            }
        } else if (memberId) {
            where.memberId = memberId;
        }

        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { count, rows: fines } = await Fine.findAndCountAll({
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
            data: fines || [],
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total: count || 0, 
                pages: Math.ceil((count || 0) / limit) 
            }
        });
    } catch (error) {
        console.error('Error fetching fines:', error);
        res.status(500).json({ success: false, message: 'Error fetching fines' });
    }
});

/**
 * GET /api/fines/paid
 * Get paid fines
 */
router.get('/paid', auth, async (req, res) => {
    try {
        const where = { status: 'paid' };
        
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) {
                where.memberId = member.id;
            }
        }

        const fines = await Fine.findAll({
            where,
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ],
            order: [['paidDate', 'DESC']]
        });

        res.json({ success: true, data: fines });
    } catch (error) {
        console.error('Error fetching paid fines:', error);
        res.status(500).json({ success: false, message: 'Error fetching paid fines' });
    }
});

/**
 * GET /api/fines/pending
 * Get pending fines
 */
router.get('/pending', auth, async (req, res) => {
    try {
        const where = { status: 'unpaid' };
        
        if (!['admin', 'treasurer', 'secretary'].includes(req.user.role)) {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) {
                where.memberId = member.id;
            }
        }

        const fines = await Fine.findAll({
            where,
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ],
            order: [['dueDate', 'ASC']]
        });

        res.json({ success: true, data: fines });
    } catch (error) {
        console.error('Error fetching pending fines:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending fines' });
    }
});

/**
 * GET /api/fines/statistics
 * Get fine statistics
 */
router.get('/statistics', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const total = await Fine.count();
        const unpaid = await Fine.count({ where: { status: 'unpaid' } });
        const paid = await Fine.count({ where: { status: 'paid' } });

        const totalOutstanding = await Fine.sum('amount', { where: { status: 'unpaid' } }) || 0;

        res.json({
            success: true,
            data: { total, unpaid, paid, totalOutstanding }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/fines/total
 * Get total outstanding fines
 */
router.get('/total', auth, authorize('admin', 'treasurer', 'secretary'), async (req, res) => {
    try {
        const result = await Fine.sum('amount', { where: { status: 'unpaid' } });

        res.json({ success: true, data: { total: result || 0 } });
    } catch (error) {
        console.error('Error fetching total:', error);
        res.status(500).json({ success: false, message: 'Error fetching total' });
    }
});

/**
 * GET /api/fines/:id
 * Get fine by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const fine = await Fine.findByPk(req.params.id, {
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ]
        });

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        res.json({ success: true, data: fine });
    } catch (error) {
        console.error('Error fetching fine:', error);
        res.status(500).json({ success: false, message: 'Error fetching fine' });
    }
});

/**
 * POST /api/fines
 * Issue fine (admin)
 */
router.post('/', auth, authorize('admin', 'secretary', 'treasurer'), [
    body('memberId').notEmpty(),
    body('amount').isNumeric(),
    body('dueDate').isISO8601(),
    validate
], async (req, res) => {
    try {
        const { memberId, fineType, amount, dueDate, description } = req.body;

        // Generate fine number
        const fineCount = await Fine.count() + 1;
        const fineNumber = `FINE${String(fineCount).padStart(6, '0')}`;

        const fine = await Fine.create({
            memberId,
            fineNumber,
            fineType: fineType || { name: 'Other', category: 'other' },
            amount,
            dueDate,
            description,
            issuedBy: req.user.id
        });

        res.status(201).json({ success: true, message: 'Fine issued', data: fine });
    } catch (error) {
        console.error('Error issuing fine:', error);
        res.status(500).json({ success: false, message: 'Error issuing fine' });
    }
});

/**
 * PATCH /api/fines/:id/pay
 * Mark fine as paid
 */
router.patch('/:id/pay', auth, async (req, res) => {
    try {
        const { method, reference } = req.body;
        const fine = await Fine.findByPk(req.params.id);

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        fine.status = 'paid';
        fine.paidDate = new Date();
        fine.paymentMethod = method;
        fine.paymentReference = reference;

        await fine.save();

        res.json({ success: true, message: 'Fine paid', data: fine });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, message: 'Error processing payment' });
    }
});

/**
 * POST /api/fines/:id/remind
 * Send fine reminder
 */
router.post('/:id/remind', auth, authorize('admin'), async (req, res) => {
    try {
        const fine = await Fine.findByPk(req.params.id, {
            include: [
                { model: Member, as: 'member' }
            ]
        });

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        // Parse existing reminders or create new array
        const remindersSent = typeof fine.remindersSent === 'string' 
            ? JSON.parse(fine.remindersSent) 
            : (fine.remindersSent || []);
        
        remindersSent.push({ date: new Date(), sentBy: req.user.id });
        fine.remindersSent = remindersSent;

        await fine.save();

        res.json({ success: true, message: 'Reminder sent' });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ success: false, message: 'Error sending reminder' });
    }
});

/**
 * PATCH /api/fines/:id/waive
 * Waive fine
 */
router.patch('/:id/waive', auth, authorize('admin'), async (req, res) => {
    try {
        const { reason } = req.body;
        const fine = await Fine.findByPk(req.params.id);

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        fine.status = 'waived';
        fine.waivedBy = req.user.id;
        fine.waiverReason = reason;
        fine.waivedAt = new Date();

        await fine.save();

        res.json({ success: true, message: 'Fine waived', data: fine });
    } catch (error) {
        console.error('Error waiving fine:', error);
        res.status(500).json({ success: false, message: 'Error waiving fine' });
    }
});

/**
 * DELETE /api/fines/:id
 * Delete fine (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const fine = await Fine.findByPk(req.params.id);
        
        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }
        
        await fine.destroy();
        
        res.json({ success: true, message: 'Fine deleted' });
    } catch (error) {
        console.error('Error deleting fine:', error);
        res.status(500).json({ success: false, message: 'Error deleting fine' });
    }
});

module.exports = router;

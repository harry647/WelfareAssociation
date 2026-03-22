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
        let query = {};

        if (!['admin', 'treasurer'].includes(req.user.role)) {
            const member = await Member.findOne({ userId: req.user._id });
            if (member) query.member = member._id;
        } else if (memberId) {
            query.member = memberId;
        }

        if (status) query.status = status;

        const fines = await Fine.find(query)
            .populate('member', 'firstName lastName memberNumber email')
            .populate('issuedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Fine.countDocuments(query);

        res.json({
            success: true,
            data: fines,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching fines' });
    }
});

/**
 * GET /api/fines/pending
 * Get pending fines
 */
router.get('/pending', auth, async (req, res) => {
    try {
        let query = { status: 'unpaid' };
        
        if (!['admin', 'treasurer'].includes(req.user.role)) {
            const member = await Member.findOne({ userId: req.user._id });
            if (member) query.member = member._id;
        }

        const fines = await Fine.find(query)
            .populate('member', 'firstName lastName memberNumber email phone')
            .sort({ dueDate: 1 });

        res.json({ success: true, data: fines });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching pending fines' });
    }
});

/**
 * GET /api/fines/statistics
 * Get fine statistics
 */
router.get('/statistics', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const total = await Fine.countDocuments();
        const unpaid = await Fine.countDocuments({ status: 'unpaid' });
        const paid = await Fine.countDocuments({ status: 'paid' });

        const outstanding = await Fine.aggregate([
            { $match: { status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: { total, unpaid, paid, totalOutstanding: outstanding[0]?.total || 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/fines/total
 * Get total outstanding fines
 */
router.get('/total', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const result = await Fine.aggregate([
            { $match: { status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({ success: true, data: { total: result[0]?.total || 0 } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching total' });
    }
});

/**
 * GET /api/fines/:id
 * Get fine by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const fine = await Fine.findById(req.params.id)
            .populate('member', 'firstName lastName memberNumber email phone')
            .populate('issuedBy', 'firstName lastName');

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        res.json({ success: true, data: fine });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching fine' });
    }
});

/**
 * POST /api/fines
 * Issue fine (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('memberId').notEmpty(),
    body('amount').isNumeric(),
    body('dueDate').isISO8601(),
    validate
], async (req, res) => {
    try {
        const { memberId, fineType, amount, dueDate, description } = req.body;

        const fine = await Fine.create({
            member: memberId,
            fineType: fineType || { name: 'Other', category: 'other' },
            amount,
            dueDate,
            description,
            issuedBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Fine issued', data: fine });
    } catch (error) {
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
        const fine = await Fine.findById(req.params.id);

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
        res.status(500).json({ success: false, message: 'Error processing payment' });
    }
});

/**
 * POST /api/fines/:id/remind
 * Send fine reminder
 */
router.post('/:id/remind', auth, authorize('admin'), async (req, res) => {
    try {
        const fine = await Fine.findById(req.params.id).populate('member');

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        fine.remindersSent.push({ date: new Date(), sentBy: req.user._id });
        await fine.save();

        res.json({ success: true, message: 'Reminder sent' });
    } catch (error) {
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
        const fine = await Fine.findById(req.params.id);

        if (!fine) {
            return res.status(404).json({ success: false, message: 'Fine not found' });
        }

        fine.status = 'waived';
        fine.waivedBy = req.user._id;
        fine.waiverReason = reason;
        fine.waivedAt = new Date();

        await fine.save();

        res.json({ success: true, message: 'Fine waived', data: fine });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error waiving fine' });
    }
});

/**
 * DELETE /api/fines/:id
 * Delete fine (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        await Fine.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Fine deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting fine' });
    }
});

module.exports = router;

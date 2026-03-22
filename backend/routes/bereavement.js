/**
 * Bereavement Routes
 * Handles bereavement support and contributions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bereavement = require('../models/Bereavement');
const Member = require('../models/Member');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/bereavement
 * Get all bereavement cases
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let query = {};

        // Filter by role
        if (req.user.role === 'member') {
            const member = await Member.findOne({ userId: req.user._id });
            if (member) {
                query.member = member._id;
            }
        }

        if (status) query.status = status;

        const cases = await Bereavement.find(query)
            .populate('member', 'firstName lastName memberNumber email phone')
            .populate('contributions.contributor', 'firstName lastName memberNumber')
            .populate('messages.sender', 'firstName lastName memberNumber')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Bereavement.countDocuments(query);

        res.json({
            success: true,
            data: cases,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bereavement cases' });
    }
});

/**
 * GET /api/bereavement/urgent
 * Get urgent/active cases that need contributions
 */
router.get('/urgent', auth, async (req, res) => {
    try {
        const cases = await Bereavement.find({ 
            status: 'active',
            'deceased.dateOfBurial': { $gte: new Date() }
        })
            .populate('member', 'firstName lastName memberNumber email phone')
            .sort({ 'deceased.dateOfBurial': 1 });

        res.json({ success: true, data: cases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching urgent cases' });
    }
});

/**
 * GET /api/bereavement/active
 * Get active bereavement cases
 */
router.get('/active', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const cases = await Bereavement.find({ status: 'active' })
            .populate('member', 'firstName lastName memberNumber email phone')
            .populate('contributions.contributor', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Bereavement.countDocuments({ status: 'active' });

        res.json({
            success: true,
            data: cases,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching active cases' });
    }
});

/**
 * GET /api/bereavement/statistics
 * Get bereavement statistics
 */
router.get('/statistics', auth, authorize('admin', 'treasurer', 'chairman', 'secretary'), async (req, res) => {
    try {
        const totalCases = await Bereavement.countDocuments();
        const activeCases = await Bereavement.countDocuments({ status: 'active' });
        const pendingCases = await Bereavement.countDocuments({ status: 'pending' });
        const closedCases = await Bereavement.countDocuments({ status: 'closed' });

        const cases = await Bereavement.find({ status: 'active' });
        const totalContributions = cases.reduce((sum, c) => sum + (c.totalContributions || 0), 0);

        // Cases in the next 7 days
        const upcomingBurials = await Bereavement.countDocuments({
            status: 'active',
            'deceased.dateOfBurial': {
                $gte: new Date(),
                $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.json({
            success: true,
            data: {
                totalCases,
                activeCases,
                pendingCases,
                closedCases,
                totalContributions,
                upcomingBurials,
                averageContribution: activeCases > 0 ? totalContributions / activeCases : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/bereavement/:id
 * Get bereavement case by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const bereavement = await Bereavement.findById(req.params.id)
            .populate('member', 'firstName lastName memberNumber email phone address')
            .populate('contributions.contributor', 'firstName lastName memberNumber')
            .populate('messages.sender', 'firstName lastName memberNumber')
            .populate('createdBy', 'firstName lastName');

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        res.json({ success: true, data: bereavement });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bereavement case' });
    }
});

/**
 * POST /api/bereavement
 * Create a new bereavement case
 */
router.post('/', auth, authorize('admin', 'secretary', 'treasurer'), [
    body('deceased.name').notEmpty().withMessage('Deceased name is required'),
    body('deceased.relationship').notEmpty().withMessage('Relationship is required'),
    body('deceased.dateOfDeath').isISO8601().withMessage('Date of death is required'),
    body('memberId').notEmpty().withMessage('Member ID is required')
], validate, async (req, res) => {
    try {
        const { deceased, memberId, notes } = req.body;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const bereavement = new Bereavement({
            deceased,
            member: memberId,
            notes: notes || '',
            createdBy: req.user._id,
            status: 'pending'
        });

        await bereavement.save();

        res.status(201).json({
            success: true,
            message: 'Bereavement case created successfully',
            data: bereavement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating bereavement case' });
    }
});

/**
 * PUT /api/bereavement/:id
 * Update bereavement case
 */
router.put('/:id', auth, authorize('admin', 'secretary', 'treasurer'), async (req, res) => {
    try {
        const bereavement = await Bereavement.findById(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        const { deceased, notes, status } = req.body;

        if (deceased) {
            if (deceased.name) bereavement.deceased.name = deceased.name;
            if (deceased.relationship) bereavement.deceased.relationship = deceased.relationship;
            if (deceased.dateOfDeath) bereavement.deceased.dateOfDeath = deceased.dateOfDeath;
            if (deceased.dateOfBurial !== undefined) bereavement.deceased.dateOfBurial = deceased.dateOfBurial;
            if (deceased.cause !== undefined) bereavement.deceased.cause = deceased.cause;
        }

        if (notes !== undefined) bereavement.notes = notes;
        if (status) bereavement.status = status;

        await bereavement.save();

        res.json({
            success: true,
            message: 'Bereavement case updated successfully',
            data: bereavement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating bereavement case' });
    }
});

/**
 * POST /api/bereavement/:id/contribute
 * Add contribution to a bereavement case
 */
router.post('/:id/contribute', auth, [
    body('amount').isNumeric().withMessage('Amount is required'),
], validate, async (req, res) => {
    try {
        const bereavement = await Bereavement.findById(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        if (bereavement.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Case is closed, cannot contribute' });
        }

        const { amount, paymentMethod, reference, message } = req.body;

        // Find member
        const member = await Member.findOne({ userId: req.user._id });
        
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        bereavement.contributions.push({
            contributor: member._id,
            amount,
            paymentMethod: paymentMethod || 'cash',
            reference: reference || '',
            message: message || ''
        });

        // Update total contributions
        bereavement.totalContributions = bereavement.contributions.reduce((sum, c) => sum + c.amount, 0);

        // Update status to active if pending
        if (bereavement.status === 'pending') {
            bereavement.status = 'active';
        }

        await bereavement.save();

        res.json({
            success: true,
            message: 'Contribution added successfully',
            data: bereavement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding contribution' });
    }
});

/**
 * GET /api/bereavement/:id/messages
 * Get messages for a bereavement case
 */
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const bereavement = await Bereavement.findById(req.params.id)
            .populate('messages.sender', 'firstName lastName memberNumber');

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        res.json({ success: true, data: bereavement.messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

/**
 * POST /api/bereavement/:id/messages
 * Add a message to a bereavement case
 */
router.post('/:id/messages', auth, [
    body('message').notEmpty().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const bereavement = await Bereavement.findById(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        const { message } = req.body;

        // Find member
        const member = await Member.findOne({ userId: req.user._id });
        
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        bereavement.messages.push({
            sender: member._id,
            message
        });

        await bereavement.save();

        const updatedCase = await Bereavement.findById(req.params.id)
            .populate('messages.sender', 'firstName lastName memberNumber');

        res.json({
            success: true,
            message: 'Message added successfully',
            data: updatedCase.messages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding message' });
    }
});

/**
 * DELETE /api/bereavement/:id
 * Delete bereavement case (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const bereavement = await Bereavement.findByIdAndDelete(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        res.json({ success: true, message: 'Bereavement case deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting bereavement case' });
    }
});

module.exports = router;
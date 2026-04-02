/**
 * Bereavement Routes
 * Handles bereavement support and contributions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Bereavement = require('../models/Bereavement');
const Member = require('../models/Member');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/bereavement
 * Get all bereavement cases (public endpoint)
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const where = {};

        // Filter by role if authenticated
        if (req.user && req.user.role === 'member') {
            const member = await Member.findOne({ where: { userId: req.user.id } });
            if (member) {
                where.memberId = member.id;
            }
        }

        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { count, rows: cases } = await Bereavement.findAndCountAll({
            where,
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        // Convert Sequelize instances to plain objects
        const data = cases.map(c => {
            const json = c.toJSON();
            // Ensure JSON fields are properly parsed
            if (json.deceased && typeof json.deceased === 'string') {
                try {
                    json.deceased = JSON.parse(json.deceased);
                } catch (e) {
                    json.deceased = {};
                }
            }
            if (json.contributions && typeof json.contributions === 'string') {
                try {
                    json.contributions = JSON.parse(json.contributions);
                } catch (e) {
                    json.contributions = [];
                }
            }
            if (json.messages && typeof json.messages === 'string') {
                try {
                    json.messages = JSON.parse(json.messages);
                } catch (e) {
                    json.messages = [];
                }
            }
            return json;
        });
        
        res.json({
            success: true,
            data: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching bereavement cases:', error);
        res.status(500).json({ success: false, message: 'Error fetching bereavement cases' });
    }
});

/**
 * GET /api/bereavement/urgent
 * Get urgent/active cases that need contributions
 */
router.get('/urgent', auth, async (req, res) => {
    try {
        const where = { 
            status: 'active'
        };
        
        const cases = await Bereavement.findAll({
            where,
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json({ success: true, data: cases });
    } catch (error) {
        console.error('Error fetching urgent cases:', error);
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
        
        const offset = (page - 1) * limit;
        const { count, rows: cases } = await Bereavement.findAndCountAll({
            where: { status: 'active' },
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: cases || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching active cases:', error);
        res.status(500).json({ success: false, message: 'Error fetching active cases' });
    }
});

/**
 * GET /api/bereavement/statistics
 * Get bereavement statistics
 */
router.get('/statistics', auth, authorize('admin', 'treasurer', 'chairman', 'secretary'), async (req, res) => {
    try {
        const totalCases = await Bereavement.count();
        const activeCases = await Bereavement.count({ where: { status: 'active' } });
        const pendingCases = await Bereavement.count({ where: { status: 'pending' } });
        const closedCases = await Bereavement.count({ where: { status: 'closed' } });

        res.json({
            success: true,
            data: {
                totalCases,
                activeCases,
                pendingCases,
                closedCases
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/bereavement/:id
 * Get bereavement case by ID (public endpoint)
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const bereavement = await Bereavement.findByPk(req.params.id, {
            include: [
                { 
                    model: Member, 
                    as: 'member', 
                    attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone', 'address'] 
                }
            ]
        });

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        // Convert to JSON and parse JSON fields
        let data = bereavement.toJSON();
        if (data.deceased && typeof data.deceased === 'string') {
            try {
                data.deceased = JSON.parse(data.deceased);
            } catch (e) {
                data.deceased = {};
            }
        }
        if (data.contributions && typeof data.contributions === 'string') {
            try {
                data.contributions = JSON.parse(data.contributions);
            } catch (e) {
                data.contributions = [];
            }
        }
        if (data.messages && typeof data.messages === 'string') {
            try {
                data.messages = JSON.parse(data.messages);
            } catch (e) {
                data.messages = [];
            }
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching bereavement case:', error);
        res.status(500).json({ success: false, message: 'Error fetching bereavement case' });
    }
});

/**
 * POST /api/bereavement
 * Create a new bereavement case
 */
router.post('/', auth, authorize('admin', 'secretary', 'treasurer'), async (req, res) => {
    try {
        console.log('=== BEREAVEMENT POST ===');
        console.log('Raw body:', req.body);
        console.log('Headers:', req.headers['content-type']);
        
        const body = req.body;
        const memberId = body.memberId;
        const deceased = body.deceased || {};
        
        console.log('Parsed - memberId:', memberId, 'deceased:', deceased);

        // Validate required fields
        if (!memberId) {
            return res.status(400).json({ success: false, message: 'Member ID is required' });
        }
        
        const deceasedName = deceased.name || body.deceasedName;
        const deceasedRelationship = deceased.relationship || body.deceasedRelationship;
        
        console.log('Deceased name:', deceasedName, 'relationship:', deceasedRelationship);

        if (!deceasedName) {
            return res.status(400).json({ success: false, message: 'Deceased name is required' });
        }
        
        if (!deceasedRelationship) {
            return res.status(400).json({ success: false, message: 'Relationship is required' });
        }

        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found: ' + memberId });
        }

        // Generate case number
        const caseCount = await Bereavement.count() + 1;
        const caseNumber = `BRV${String(caseCount).padStart(6, '0')}`;

        const bereavement = await Bereavement.create({
            memberId,
            caseNumber,
            deceased: {
                name: deceasedName,
                relationship: deceasedRelationship,
                dateOfDeath: deceased.dateOfDeath || body.dateOfDeath || null,
                dateOfBurial: deceased.dateOfBurial || body.dateOfBurial || null
            },
            notes: body.notes || '',
            createdBy: req.user?.id === 'admin' ? null : req.user.id,
            status: body.status || 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Bereavement case created successfully',
            data: bereavement
        });
    } catch (error) {
        console.error('Error creating bereavement case:', error);
        res.status(500).json({ success: false, message: 'Error creating bereavement case: ' + error.message });
    }
});

/**
 * PUT /api/bereavement/:id
 * Update bereavement case
 */
router.put('/:id', auth, authorize('admin', 'secretary', 'treasurer'), async (req, res) => {
    try {
        const bereavement = await Bereavement.findByPk(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        const { deceasedName, deceasedRelationship, dateOfDeath, dateOfBurial, cause, notes, status } = req.body;

        if (deceasedName) bereavement.deceasedName = deceasedName;
        if (deceasedRelationship) bereavement.deceasedRelationship = deceasedRelationship;
        if (dateOfDeath) bereavement.dateOfDeath = dateOfDeath;
        if (dateOfBurial !== undefined) bereavement.dateOfBurial = dateOfBurial;
        if (cause !== undefined) bereavement.cause = cause;
        if (notes !== undefined) bereavement.notes = notes;
        if (status) bereavement.status = status;

        await bereavement.save();

        res.json({
            success: true,
            message: 'Bereavement case updated successfully',
            data: bereavement
        });
    } catch (error) {
        console.error('Error updating bereavement case:', error);
        res.status(500).json({ success: false, message: 'Error updating bereavement case' });
    }
});

/**
 * POST /api/bereavement/:id/contribute
 * Add contribution to a bereavement case (authentication optional)
 */
router.post('/:id/contribute', optionalAuth, [
    body('amount').isNumeric().withMessage('Amount is required'),
], validate, async (req, res) => {
    try {
        const bereavement = await Bereavement.findByPk(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        if (bereavement.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Case is closed, cannot contribute' });
        }

        const { amount, paymentMethod, reference, message, contributorId, contributorName } = req.body;

        // Parse existing contributions or create new array
        let contributions = [];
        if (bereavement.contributions) {
            if (typeof bereavement.contributions === 'string') {
                contributions = JSON.parse(bereavement.contributions);
            } else if (Array.isArray(bereavement.contributions)) {
                contributions = [...bereavement.contributions];
            }
        }
        
        contributions.push({
            contributorId: contributorId || (req.user ? req.user.id : null),
            contributorName: contributorName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Anonymous'),
            amount: parseFloat(amount),
            paymentMethod: paymentMethod || 'cash',
            reference: reference || '',
            message: message || '',
            date: new Date().toISOString()
        });

        // Update total contributions
        const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        
        // Create a new array to force Sequelize to detect the change
        bereavement.contributions = JSON.parse(JSON.stringify(contributions));
        bereavement.totalContributions = totalContributions;

        // Update status to active if pending
        if (bereavement.status === 'pending') {
            bereavement.status = 'active';
        }

        await bereavement.save();
        
        // Reload from database to verify
        await bereavement.reload();
        
        console.log('=== CONTRIBUTION ADDED ===');
        console.log('Contributions after save:', JSON.stringify(bereavement.contributions));

        res.json({
            success: true,
            message: 'Contribution added successfully',
            data: bereavement
        });
    } catch (error) {
        console.error('Error adding contribution:', error);
        res.status(500).json({ success: false, message: 'Error adding contribution' });
    }
});

/**
 * POST /api/bereavement/:id/messages
 * Add condolence message to a bereavement case
 */
router.post('/:id/messages', async (req, res) => {
    try {
        const bereavement = await Bereavement.findByPk(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        const { author, message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Parse existing messages or create new array
        let messages = [];
        if (bereavement.messages) {
            if (typeof bereavement.messages === 'string') {
                messages = JSON.parse(bereavement.messages);
            } else if (Array.isArray(bereavement.messages)) {
                messages = [...bereavement.messages];
            }
        }
        
        messages.push({
            author: author || 'Anonymous',
            message: message,
            date: new Date().toISOString()
        });

        // Create a new array to force Sequelize to detect the change
        bereavement.messages = JSON.parse(JSON.stringify(messages));
        
        await bereavement.save();
        
        // Reload from database to verify
        await bereavement.reload();
        
        console.log('=== MESSAGE ADDED ===');
        console.log('Messages after save:', JSON.stringify(bereavement.messages));

        res.json({
            success: true,
            message: 'Message added successfully',
            data: bereavement
        });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ success: false, message: 'Error adding message' });
    }
});

/**
 * DELETE /api/bereavement/:id
 * Delete bereavement case (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const bereavement = await Bereavement.findByPk(req.params.id);

        if (!bereavement) {
            return res.status(404).json({ success: false, message: 'Bereavement case not found' });
        }

        await bereavement.destroy();

        res.json({ success: true, message: 'Bereavement case deleted successfully' });
    } catch (error) {
        console.error('Error deleting bereavement case:', error);
        res.status(500).json({ success: false, message: 'Error deleting bereavement case' });
    }
});

module.exports = router;
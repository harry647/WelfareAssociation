/**
 * Notice Routes
 * Handles notices and announcements
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Notice = require('../models/Notice');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/notices
 * Get all published notices
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.query;
        
        let query = { isPublished: true };
        
        // Check if notice is expired
        query.$or = [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gt: new Date() } }
        ];
        
        if (type) query.type = type;

        const notices = await Notice.find(query)
            .populate('author', 'firstName lastName')
            .sort({ priority: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notice.countDocuments(query);

        res.json({
            success: true,
            data: notices,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notices' });
    }
});

/**
 * GET /api/notices/:id
 * Get notice by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id)
            .populate('author', 'firstName lastName');
        
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        // Increment views
        notice.views += 1;
        await notice.save();

        res.json({ success: true, data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notice' });
    }
});

/**
 * POST /api/notices
 * Create notice (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('title').notEmpty().trim(),
    body('content').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { title, content, type, priority, audience, isPublished, publishDate, expiryDate } = req.body;

        const notice = await Notice.create({
            title,
            content,
            type: type || 'general',
            priority: priority || 'normal',
            audience: audience || 'all',
            isPublished: isPublished || false,
            publishDate,
            expiryDate,
            author: req.user._id
        });

        res.status(201).json({ success: true, message: 'Notice created', data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating notice' });
    }
});

/**
 * PUT /api/notices/:id
 * Update notice (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        Object.assign(notice, req.body);
        await notice.save();

        res.json({ success: true, message: 'Notice updated', data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating notice' });
    }
});

/**
 * DELETE /api/notices/:id
 * Delete notice (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        await Notice.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Notice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting notice' });
    }
});

module.exports = router;

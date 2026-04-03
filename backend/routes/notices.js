/**
 * Notice Routes
 * Handles notices and announcements
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Notice = require('../models/notice');
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
        
        const where = { 
            [Op.or]: [
                { expiryDate: null },
                { expiryDate: { [Op.gt]: new Date() } }
            ]
        };
        
        if (type) where.type = type;

        const offset = (page - 1) * limit;
        const { count, rows: notices } = await Notice.findAndCountAll({
            where,
            order: [['priority', 'DESC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: notices || [],
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total: count || 0, 
                pages: Math.ceil((count || 0) / limit) 
            }
        });
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ success: false, message: 'Error fetching notices' });
    }
});

/**
 * GET /api/notices/:id
 * Get notice by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        // Increment views
        notice.views = (notice.views || 0) + 1;
        await notice.save();

        res.json({ success: true, data: notice });
    } catch (error) {
        console.error('Error fetching notice:', error);
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
            author: req.user && req.user.id && req.user.id.includes('-') ? req.user.id : null
        });

        res.status(201).json({ success: true, message: 'Notice created', data: notice });
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ success: false, message: 'Error creating notice' });
    }
});

/**
 * PUT /api/notices/:id
 * Update notice (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        const { title, content, type, priority, audience, isPublished, publishDate, expiryDate } = req.body;

        if (title) notice.title = title;
        if (content) notice.content = content;
        if (type) notice.type = type;
        if (priority) notice.priority = priority;
        if (audience) notice.audience = audience;
        if (isPublished !== undefined) notice.isPublished = isPublished;
        if (publishDate) notice.publishDate = publishDate;
        if (expiryDate) notice.expiryDate = expiryDate;

        await notice.save();

        res.json({ success: true, message: 'Notice updated', data: notice });
    } catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ success: false, message: 'Error updating notice' });
    }
});

/**
 * DELETE /api/notices/:id
 * Delete notice (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        await notice.destroy();
        
        res.json({ success: true, message: 'Notice deleted' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ success: false, message: 'Error deleting notice' });
    }
});

module.exports = router;

/**
 * Announcement Routes
 * Handles announcements and notifications
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Announcement = require('../models/Announcement');
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
 * GET /api/announcements
 * Get all announcements
 */
router.get('/', auth, async (req, res) => {
    try {
        const { type, priority, status, page = 1, limit = 10 } = req.query;
        const where = {};

        if (type) where.type = type;
        if (priority) where.priority = priority;
        
        if (status === 'active') {
            where.isActive = true;
            where[Op.or] = [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: new Date() } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows: announcements } = await Announcement.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: announcements || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ success: false, message: 'Error fetching announcements' });
    }
});

/**
 * GET /api/announcements/:id
 * Get announcement by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Increment view count
        announcement.viewCount = (announcement.viewCount || 0) + 1;
        await announcement.save();

        res.json({ success: true, data: announcement });
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ success: false, message: 'Error fetching announcement' });
    }
});

/**
 * POST /api/announcements
 * Create announcement (admin only)
 */
router.post('/', auth, authorize('admin', 'chairman', 'secretary'), [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required')
], validate, async (req, res) => {
    try {
        const { title, content, type, priority, targetAudience, specificMembers, expiresAt } = req.body;

        const announcement = await Announcement.create({
            title,
            content,
            type: type || 'general',
            priority: priority || 'medium',
            targetAudience: targetAudience || 'all',
            specificMembers: specificMembers || [],
            sentBy: req.user.id,
            expiresAt: expiresAt || null
        });

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: announcement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ success: false, message: 'Error creating announcement' });
    }
});

/**
 * PUT /api/announcements/:id
 * Update announcement (admin only)
 */
router.put('/:id', auth, authorize('admin', 'chairman', 'secretary'), async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const { title, content, type, priority, targetAudience, specificMembers, expiresAt, isActive } = req.body;

        if (title) announcement.title = title;
        if (content) announcement.content = content;
        if (type) announcement.type = type;
        if (priority) announcement.priority = priority;
        if (targetAudience) announcement.targetAudience = targetAudience;
        if (specificMembers) announcement.specificMembers = specificMembers;
        if (expiresAt !== undefined) announcement.expiresAt = expiresAt;
        if (isActive !== undefined) announcement.isActive = isActive;

        await announcement.save();

        res.json({
            success: true,
            message: 'Announcement updated successfully',
            data: announcement
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ success: false, message: 'Error updating announcement' });
    }
});

/**
 * DELETE /api/announcements/:id
 * Delete announcement (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        await announcement.destroy();

        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ success: false, message: 'Error deleting announcement' });
    }
});

/**
 * POST /api/announcements/:id/view
 * Mark announcement as viewed by current user
 */
router.post('/:id/view', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Increment view count
        announcement.viewCount = (announcement.viewCount || 0) + 1;
        await announcement.save();

        res.json({ success: true, message: 'Announcement marked as viewed' });
    } catch (error) {
        console.error('Error marking announcement as viewed:', error);
        res.status(500).json({ success: false, message: 'Error marking announcement as viewed' });
    }
});

module.exports = router;

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
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Helper function to get proper user UUID
async function getUserUuid(userId) {
    try {
        // If it's already a valid UUID format, return it
        if (typeof userId === 'string' && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            return userId;
        }
        
        // For non-UUID values, only search by email or other non-UUID fields
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: userId },
                    { email: userId + '@example.com' }, // Handle simple usernames
                    { email: userId + '@swa.com' },      // Handle organization usernames
                    { role: userId }                     // Handle role-based lookup (e.g., 'admin')
                ]
            }
        });
        
        if (user) {
            console.log('Found user:', user.id, 'for input:', userId);
            return user.id;
        }
        
        // If still not found, try to find any admin user as fallback
        const adminUser = await User.findOne({
            where: { role: 'admin' }
        });
        
        if (adminUser) {
            console.log('Using fallback admin user:', adminUser.id);
            return adminUser.id;
        }
        
        console.log('Could not find user for ID:', userId);
        return null;
    } catch (error) {
        console.error('Error getting user UUID:', error);
        return null;
    }
}

/**
 * GET /api/announcements
 * Get all announcements
 */
router.get('/', auth, async (req, res) => {
    try {
        console.log('Announcements API called with query:', req.query);
        const { type, priority, status, targetAudience, page = 1, limit = 10 } = req.query;
        const where = {};

        if (type) where.type = type;
        if (priority) where.priority = priority;
        if (targetAudience) where.targetAudience = targetAudience;
        
        if (status === 'active') {
            where.isActive = true;
            where[Op.or] = [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: new Date() } }
            ];
        }

        console.log('Announcements WHERE clause:', where);

        const offset = (page - 1) * limit;
        const { count, rows: announcements } = await Announcement.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        console.log('Found announcements:', announcements.length);
        console.log('Announcements data:', announcements);

        res.json({
            success: true,
            announcements: announcements || [],
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

        // Get proper user UUID for sentBy
        const sentByUuid = await getUserUuid(req.user.id);
        if (!sentByUuid) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const announcement = await Announcement.create({
            title,
            content,
            type: type || 'general',
            priority: priority || 'medium',
            targetAudience: targetAudience || 'all',
            specificMembers: specificMembers || [],
            sentBy: sentByUuid,
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

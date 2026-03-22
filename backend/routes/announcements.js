/**
 * Announcement Routes
 * Handles announcements and notifications
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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
        let query = {};

        // Filter by visibility
        if (req.user.role === 'member') {
            query.$or = [
                { visibility: { $in: ['all', 'members'] } },
                { targetAudience: 'all' },
                { specificMembers: { $in: [req.user._id] } }
            ];
        } else if (req.user.role === 'officer') {
            query.$or = [
                { visibility: { $in: ['all', 'members', 'officers'] } },
                { targetAudience: { $in: ['all', 'officers'] } }
            ];
        }

        if (type) query.type = type;
        if (priority) query.priority = priority;
        if (status === 'active') {
            query.isActive = true;
            query.$or = query.$or || [];
            query.$or.push(
                { expiresAt: { $gte: new Date() } },
                { expiresAt: null }
            );
        }

        const announcements = await Announcement.find(query)
            .populate('sentBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Announcement.countDocuments(query);

        res.json({
            success: true,
            data: announcements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching announcements' });
    }
});

/**
 * GET /api/announcements/:id
 * Get announcement by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('sentBy', 'firstName lastName email');

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Increment view count
        announcement.viewCount += 1;
        await announcement.save();

        res.json({ success: true, data: announcement });
    } catch (error) {
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

        const announcement = new Announcement({
            title,
            content,
            type: type || 'general',
            priority: priority || 'medium',
            targetAudience: targetAudience || 'all',
            specificMembers: specificMembers || [],
            sentBy: req.user._id,
            expiresAt: expiresAt || null
        });

        await announcement.save();

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: announcement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating announcement' });
    }
});

/**
 * PUT /api/announcements/:id
 * Update announcement (admin only)
 */
router.put('/:id', auth, authorize('admin', 'chairman', 'secretary'), async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

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
        res.status(500).json({ success: false, message: 'Error updating announcement' });
    }
});

/**
 * DELETE /api/announcements/:id
 * Delete announcement (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting announcement' });
    }
});

/**
 * POST /api/announcements/:id/send
 * Send announcement to specific members
 */
router.post('/:id/send', auth, authorize('admin', 'chairman', 'secretary'), [
    body('memberIds').isArray().withMessage('Member IDs array is required')
], validate, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const { memberIds } = req.body;

        // Add recipients
        memberIds.forEach(memberId => {
            const exists = announcement.recipients.find(r => r.member.toString() === memberId);
            if (!exists) {
                announcement.recipients.push({ member: memberId });
            }
        });

        announcement.sentAt = new Date();
        await announcement.save();

        res.json({
            success: true,
            message: 'Announcement sent to members successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending announcement' });
    }
});

/**
 * POST /api/announcements/:id/view
 * Mark announcement as viewed by current user
 */
router.post('/:id/view', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const recipient = announcement.recipients.find(r => r.member && r.member.toString() === req.user._id.toString());
        
        if (recipient) {
            recipient.viewed = true;
            recipient.viewedAt = new Date();
        } else {
            // If not a specific recipient, still track the view
            announcement.viewCount += 1;
        }

        await announcement.save();

        res.json({ success: true, message: 'Announcement marked as viewed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking announcement as viewed' });
    }
});

module.exports = router;

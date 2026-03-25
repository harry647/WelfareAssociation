/**
 * Contact Routes
 * Handles contact inquiries and messages
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/contact
 * Get all contacts (admin only)
 */
router.get('/', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const { status, priority, category, page = 1, limit = 10 } = req.query;
        let query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;

        const contacts = await Contact.findAll({
            where: query,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        const total = await Contact.count({ where: query });

        res.json({
            success: true,
            data: contacts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching contacts' });
    }
});

/**
 * GET /api/contact/unread
 * Get unread contact count (admin only)
 */
router.get('/unread', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const count = await Contact.count({ where: { status: 'new' } });
        res.json({ success: true, data: { unread: count } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
});

/**
 * GET /api/contact/:id
 * Get contact by ID
 */
router.get('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        // Mark as read if not already
        if (!contact.isRead) {
            contact.isRead = true;
            contact.readAt = new Date();
            contact.readBy = req.user.id;
            await contact.save();
        }

        res.json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching contact' });
    }
});

/**
 * POST /api/contact
 * Submit contact inquiry (public)
 */
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const { name, email, phone, subject, message, category } = req.body;

        const contact = new Contact({
            name,
            email,
            phone: phone || '',
            subject,
            message,
            category: category || 'general',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        await contact.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

/**
 * PUT /api/contact/:id
 * Update contact status (admin only)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        const { status, priority, assignedTo } = req.body;

        if (status) contact.status = status;
        if (priority) contact.priority = priority;
        if (assignedTo !== undefined) contact.assignedTo = assignedTo;

        await contact.save();

        res.json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating contact' });
    }
});

/**
 * POST /api/contact/:id/reply
 * Reply to contact (admin only)
 */
router.post('/:id/reply', auth, authorize('admin', 'secretary'), [
    body('reply').notEmpty().withMessage('Reply message is required')
], validate, async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        // In a real application, you would send an email here
        // For now, just update the status
        contact.status = 'replied';
        contact.repliedBy = req.user.id;
        contact.repliedAt = new Date();
        
        await contact.save();

        res.json({
            success: true,
            message: 'Reply sent successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending reply' });
    }
});

/**
 * DELETE /api/contact/:id
 * Delete contact (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        await contact.destroy();

        res.json({ success: true, message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting contact' });
    }
});

/**
 * GET /api/messages
 * Get all messages (alias for /api/contact)
 */
router.get('/messages', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const { status, priority, category, page = 1, limit = 10 } = req.query;
        let query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;

        const contacts = await Contact.findAll({
            where: query,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        const total = await Contact.count({ where: query });

        res.json({
            success: true,
            data: contacts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

module.exports = router;

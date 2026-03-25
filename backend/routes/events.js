/**
 * Event Routes
 * Handles events and activities
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Event = require('../models/Event');
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
 * GET /api/events
 * Get all published events
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10 } = req.query;
        
        const where = {};
        
        // Default to published for non-admin users
        if (!['admin', 'secretary'].includes(req.user?.role)) {
            where.status = 'published';
        } else if (status) {
            where.status = status;
        }
        
        if (type) where.type = type;

        const offset = (page - 1) * limit;
        const { count, rows: events } = await Event.findAndCountAll({
            where,
            order: [['eventDate', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: events || [],
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total: count || 0, 
                pages: Math.ceil((count || 0) / limit) 
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
});

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data: event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ success: false, message: 'Error fetching event' });
    }
});

/**
 * POST /api/events
 * Create event (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('title').notEmpty().trim(),
    body('description').notEmpty(),
    body('eventDate').isISO8601(),
    validate
], async (req, res) => {
    try {
        const { title, description, eventDate, endDate, location, type, requiresRegistration, maxAttendees, image } = req.body;

        const event = await Event.create({
            title,
            description,
            eventDate,
            endDate,
            location,
            type: type || 'other',
            requiresRegistration: requiresRegistration || false,
            maxAttendees,
            image,
            organizer: req.user.id,
            status: 'draft'
        });

        res.status(201).json({ success: true, message: 'Event created', data: event });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Error creating event' });
    }
});

/**
 * PUT /api/events/:id
 * Update event (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const { title, description, eventDate, endDate, location, type, requiresRegistration, maxAttendees, image, status } = req.body;

        if (title) event.title = title;
        if (description) event.description = description;
        if (eventDate) event.eventDate = eventDate;
        if (endDate) event.endDate = endDate;
        if (location) event.location = location;
        if (type) event.type = type;
        if (requiresRegistration !== undefined) event.requiresRegistration = requiresRegistration;
        if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
        if (image) event.image = image;
        if (status) event.status = status;

        await event.save();

        res.json({ success: true, message: 'Event updated', data: event });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Error updating event' });
    }
});

/**
 * POST /api/events/:id/register
 * Register for event
 */
router.post('/:id/register', auth, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!event.requiresRegistration) {
            return res.status(400).json({ success: false, message: 'Registration not required for this event' });
        }

        const registeredAttendees = typeof event.registeredAttendees === 'string' 
            ? JSON.parse(event.registeredAttendees) 
            : (event.registeredAttendees || []);

        if (event.maxAttendees && registeredAttendees.length >= event.maxAttendees) {
            return res.status(400).json({ success: false, message: 'Event is full' });
        }

        const member = await Member.findOne({ where: { userId: req.user.id } });
        
        // Check if already registered
        const alreadyRegistered = registeredAttendees.find(
            r => r.memberId === member?.id
        );

        if (alreadyRegistered) {
            return res.status(400).json({ success: false, message: 'Already registered for this event' });
        }

        registeredAttendees.push({
            memberId: member?.id,
            registeredAt: new Date(),
            status: 'registered'
        });

        event.registeredAttendees = registeredAttendees;
        await event.save();

        res.json({ success: true, message: 'Successfully registered for event' });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ success: false, message: 'Error registering for event' });
    }
});

/**
 * DELETE /api/events/:id
 * Delete event (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        await event.destroy();
        
        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Error deleting event' });
    }
});

module.exports = router;

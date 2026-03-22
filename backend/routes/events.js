/**
 * Event Routes
 * Handles events and activities
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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
        
        let query = { status: 'published' };
        
        if (type) query.type = type;
        if (status && ['admin', 'secretary'].includes(req.user?.role)) {
            query.status = status;
        }

        const events = await Event.find(query)
            .populate('organizer', 'firstName lastName')
            .sort({ eventDate: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Event.countDocuments(query);

        res.json({
            success: true,
            data: events,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
});

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'firstName lastName')
            .populate('registeredAttendees.member', 'firstName lastName memberNumber');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data: event });
    } catch (error) {
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
            organizer: req.user._id,
            status: 'draft'
        });

        res.status(201).json({ success: true, message: 'Event created', data: event });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating event' });
    }
});

/**
 * PUT /api/events/:id
 * Update event (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, message: 'Event updated', data: event });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating event' });
    }
});

/**
 * POST /api/events/:id/register
 * Register for event
 */
router.post('/:id/register', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!event.requiresRegistration) {
            return res.status(400).json({ success: false, message: 'Registration not required for this event' });
        }

        if (event.maxAttendees && event.registeredAttendees.length >= event.maxAttendees) {
            return res.status(400).json({ success: false, message: 'Event is full' });
        }

        const member = await Member.findOne({ userId: req.user._id });
        
        // Check if already registered
        const alreadyRegistered = event.registeredAttendees.find(
            r => r.member.toString() === member._id.toString()
        );

        if (alreadyRegistered) {
            return res.status(400).json({ success: false, message: 'Already registered for this event' });
        }

        event.registeredAttendees.push({
            member: member._id,
            registeredAt: new Date(),
            status: 'registered'
        });

        await event.save();

        res.json({ success: true, message: 'Successfully registered for event' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error registering for event' });
    }
});

/**
 * DELETE /api/events/:id
 * Delete event (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting event' });
    }
});

module.exports = router;

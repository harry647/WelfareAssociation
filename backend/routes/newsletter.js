/**
 * Newsletter Routes
 * Handles newsletter subscriptions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Newsletter = require('../models/Newsletter');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/newsletter
 * Get all subscribers (admin only)
 */
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { isActive, page = 1, limit = 10 } = req.query;
        let query = {};

        if (isActive !== undefined) query.isActive = isActive === 'true';

        const subscribers = await Newsletter.find(query)
            .sort({ subscribedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Newsletter.countDocuments(query);

        res.json({
            success: true,
            data: subscribers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching subscribers' });
    }
});

/**
 * POST /api/newsletter
 * Subscribe to newsletter (public)
 */
router.post('/', [
    body('email').isEmail().withMessage('Valid email is required')
], validate, async (req, res) => {
    try {
        const { email, name } = req.body;

        // Check if already subscribed
        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        
        if (existing) {
            if (existing.isActive) {
                return res.status(400).json({ success: false, message: 'Email already subscribed' });
            }
            // Reactivate subscription
            existing.isActive = true;
            existing.unsubscribedAt = null;
            existing.subscribedAt = new Date();
            await existing.save();
            
            return res.json({
                success: true,
                message: 'Subscription reactivated successfully'
            });
        }

        const subscriber = new Newsletter({
            email,
            name: name || '',
            source: 'website'
        });

        await subscriber.save();

        res.status(201).json({
            success: true,
            message: 'Subscribed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error subscribing' });
    }
});

/**
 * DELETE /api/newsletter/:id
 * Unsubscribe (admin delete or user unsubscribe)
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const subscriber = await Newsletter.findById(req.params.id);

        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'Subscriber not found' });
        }

        // Soft delete - mark as inactive
        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error unsubscribing' });
    }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe by email (public)
 */
router.post('/unsubscribe', [
    body('email').isEmail().withMessage('Valid email is required')
], validate, async (req, res) => {
    try {
        const { email } = req.body;

        const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error unsubscribing' });
    }
});

module.exports = router;

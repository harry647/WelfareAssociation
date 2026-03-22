/**
 * FAQ Routes
 * Handles Frequently Asked Questions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Faq = require('../models/Faq');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/faqs
 * Get all FAQs (public)
 */
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        let query = { isActive: true };

        if (category) query.category = category;
        if (search) {
            query.$text = { $search: search };
        }

        const faqs = await Faq.find(query)
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Faq.countDocuments(query);

        res.json({
            success: true,
            data: faqs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching FAQs' });
    }
});

/**
 * GET /api/faqs/:id
 * Get FAQ by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const faq = await Faq.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        // Increment view count
        faq.viewCount += 1;
        await faq.save();

        res.json({ success: true, data: faq });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching FAQ' });
    }
});

/**
 * POST /api/faqs
 * Create FAQ (admin only)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('question').notEmpty().withMessage('Question is required'),
    body('answer').notEmpty().withMessage('Answer is required')
], validate, async (req, res) => {
    try {
        const { question, answer, category, tags, order } = req.body;

        const faq = new Faq({
            question,
            answer,
            category: category || 'general',
            tags: tags || [],
            order: order || 0,
            createdBy: req.user._id
        });

        await faq.save();

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating FAQ' });
    }
});

/**
 * PUT /api/faqs/:id
 * Update FAQ (admin only)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const faq = await Faq.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        const { question, answer, category, tags, order, isActive } = req.body;

        if (question) faq.question = question;
        if (answer) faq.answer = answer;
        if (category) faq.category = category;
        if (tags) faq.tags = tags;
        if (order !== undefined) faq.order = order;
        if (isActive !== undefined) faq.isActive = isActive;
        faq.updatedBy = req.user._id;

        await faq.save();

        res.json({
            success: true,
            message: 'FAQ updated successfully',
            data: faq
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating FAQ' });
    }
});

/**
 * DELETE /api/faqs/:id
 * Delete FAQ (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const faq = await Faq.findByIdAndDelete(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        res.json({ success: true, message: 'FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting FAQ' });
    }
});

/**
 * POST /api/faqs/:id/feedback
 * Submit feedback on FAQ helpfulness
 */
router.post('/:id/feedback', async (req, res) => {
    try {
        const { helpful } = req.body;
        const faq = await Faq.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        if (helpful) {
            faq.helpful += 1;
        } else {
            faq.notHelpful += 1;
        }

        await faq.save();

        res.json({ success: true, message: 'Feedback recorded' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error recording feedback' });
    }
});

module.exports = router;

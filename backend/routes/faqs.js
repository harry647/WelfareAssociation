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
        const where = { isActive: true };

        if (category) where.category = category;

        const offset = (page - 1) * limit;
        const { count, rows: faqs } = await Faq.findAndCountAll({
            where,
            order: [['order', 'ASC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: faqs || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ success: false, message: 'Error fetching FAQs' });
    }
});

/**
 * GET /api/faqs/categories
 * Get FAQ categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await Faq.findAll({
            attributes: ['category'],
            where: { isActive: true },
            group: ['category']
        });

        res.json({ success: true, data: categories.map(c => c.category) });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
});

/**
 * GET /api/faqs/:id
 * Get FAQ by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const faq = await Faq.findByPk(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        res.json({ success: true, data: faq });
    } catch (error) {
        console.error('Error fetching FAQ:', error);
        res.status(500).json({ success: false, message: 'Error fetching FAQ' });
    }
});

/**
 * POST /api/faqs
 * Create FAQ (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('question').notEmpty(),
    body('answer').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { question, answer, category, order } = req.body;

        const faq = await Faq.create({
            question,
            answer,
            category: category || 'general',
            order: order || 0,
            isActive: true
        });

        res.status(201).json({ success: true, message: 'FAQ created', data: faq });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({ success: false, message: 'Error creating FAQ' });
    }
});

/**
 * PUT /api/faqs/:id
 * Update FAQ (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const faq = await Faq.findByPk(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        const { question, answer, category, order, isActive } = req.body;

        if (question) faq.question = question;
        if (answer) faq.answer = answer;
        if (category) faq.category = category;
        if (order !== undefined) faq.order = order;
        if (isActive !== undefined) faq.isActive = isActive;

        await faq.save();

        res.json({ success: true, message: 'FAQ updated', data: faq });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({ success: false, message: 'Error updating FAQ' });
    }
});

/**
 * DELETE /api/faqs/:id
 * Delete FAQ (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const faq = await Faq.findByPk(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        await faq.destroy();

        res.json({ success: true, message: 'FAQ deleted' });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({ success: false, message: 'Error deleting FAQ' });
    }
});

module.exports = router;

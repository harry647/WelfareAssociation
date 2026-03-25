/**
 * News Routes
 * Handles news articles and updates
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const News = require('../models/News');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/news
 * Get all published news articles
 */
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        const where = { isPublished: true };

        if (category) where.category = category;

        const offset = (page - 1) * limit;
        const { count, rows: news } = await News.findAndCountAll({
            where,
            include: [
                { model: User, as: 'authorUser', attributes: ['firstName', 'lastName'] }
            ],
            order: [['publishDate', 'DESC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: news || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * GET /api/news/featured
 * Get featured news
 */
router.get('/featured', async (req, res) => {
    try {
        const news = await News.findAll({
            where: { isPublished: true, isFeatured: true },
            include: [
                { model: User, as: 'authorUser', attributes: ['firstName', 'lastName'] }
            ],
            order: [['publishDate', 'DESC']],
            limit: 5
        });

        res.json({ success: true, data: news });
    } catch (error) {
        console.error('Error fetching featured news:', error);
        res.status(500).json({ success: false, message: 'Error fetching featured news' });
    }
});

/**
 * GET /api/news/:id
 * Get news by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id, {
            include: [
                { model: User, as: 'authorUser', attributes: ['firstName', 'lastName'] }
            ]
        });

        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }

        res.json({ success: true, data: news });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * POST /api/news
 * Create news article (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('title').notEmpty(),
    body('content').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { title, summary, content, category, image, isFeatured, isPublished, publishDate } = req.body;

        const news = await News.create({
            title,
            summary,
            content,
            category: category || 'general',
            image,
            isFeatured: isFeatured || false,
            isPublished: isPublished || false,
            publishDate: publishDate || new Date(),
            author: req.user.id
        });

        res.status(201).json({ success: true, message: 'News article created', data: news });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ success: false, message: 'Error creating news' });
    }
});

/**
 * PUT /api/news/:id
 * Update news article (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);

        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }

        const { title, summary, content, category, image, isFeatured, isPublished, publishDate } = req.body;

        if (title) news.title = title;
        if (summary) news.summary = summary;
        if (content) news.content = content;
        if (category) news.category = category;
        if (image !== undefined) news.image = image;
        if (isFeatured !== undefined) news.isFeatured = isFeatured;
        if (isPublished !== undefined) news.isPublished = isPublished;
        if (publishDate) news.publishDate = publishDate;

        await news.save();

        res.json({ success: true, message: 'News article updated', data: news });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ success: false, message: 'Error updating news' });
    }
});

/**
 * DELETE /api/news/:id
 * Delete news article (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);

        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }

        await news.destroy();

        res.json({ success: true, message: 'News article deleted' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ success: false, message: 'Error deleting news' });
    }
});

module.exports = router;

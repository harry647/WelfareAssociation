/**
 * News Routes
 * Handles news articles and updates
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const News = require('../models/News');
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
 * GET /api/news
 * Get all published news articles
 */
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        let query = { isPublished: true };

        if (category) query.category = category;
        if (search) {
            query.$text = { $search: search };
        }

        const news = await News.find(query)
            .populate('author', 'firstName lastName')
            .sort({ publishDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await News.countDocuments(query);

        res.json({
            success: true,
            data: news,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * GET /api/news/featured
 * Get featured news
 */
router.get('/featured', async (req, res) => {
    try {
        const news = await News.find({ isPublished: true, isFeatured: true })
            .populate('author', 'firstName lastName')
            .sort({ publishDate: -1 })
            .limit(5);

        res.json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching featured news' });
    }
});

/**
 * GET /api/news/:id
 * Get news by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const news = await News.findById(req.params.id)
            .populate('author', 'firstName lastName');

        if (!news) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        // Increment view count
        news.views += 1;
        await news.save();

        res.json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * POST /api/news
 * Create news article (admin only)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required')
], validate, async (req, res) => {
    try {
        const { title, content, excerpt, category, image, tags, isPublished, isFeatured, publishDate } = req.body;

        const news = new News({
            title,
            content,
            excerpt: excerpt || content.substring(0, 150),
            category: category || 'announcement',
            image: image || '',
            tags: tags || [],
            isPublished: isPublished || false,
            isFeatured: isFeatured || false,
            publishDate: publishDate || (isPublished ? new Date() : null),
            author: req.user._id
        });

        await news.save();

        res.status(201).json({
            success: true,
            message: 'News article created successfully',
            data: news
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating news article' });
    }
});

/**
 * PUT /api/news/:id
 * Update news article (admin only)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const news = await News.findById(req.params.id);

        if (!news) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        const { title, content, excerpt, category, image, tags, isPublished, isFeatured, publishDate } = req.body;

        if (title) news.title = title;
        if (content) news.content = content;
        if (excerpt !== undefined) news.excerpt = excerpt;
        if (category) news.category = category;
        if (image !== undefined) news.image = image;
        if (tags) news.tags = tags;
        if (isPublished !== undefined) news.isPublished = isPublished;
        if (isFeatured !== undefined) news.isFeatured = isFeatured;
        if (publishDate !== undefined) news.publishDate = publishDate;
        
        // Auto-set publish date if publishing
        if (isPublished && !news.publishDate) {
            news.publishDate = new Date();
        }

        await news.save();

        res.json({
            success: true,
            message: 'News article updated successfully',
            data: news
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating news article' });
    }
});

/**
 * DELETE /api/news/:id
 * Delete news article (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);

        if (!news) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        res.json({ success: true, message: 'News article deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting news article' });
    }
});

/**
 * POST /api/news/subscribe
 * Subscribe to newsletter
 */
router.post('/subscribe', [
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
            existing.isActive = true;
            existing.unsubscribedAt = null;
            await existing.save();
            return res.json({ success: true, message: 'Subscription reactivated' });
        }

        const subscriber = new Newsletter({
            email,
            name: name || '',
            source: 'news'
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

module.exports = router;

/**
 * Gallery Routes
 * Handles gallery images and media
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Gallery = require('../models/Gallery');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/gallery';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid image file type'));
    }
});

/**
 * GET /api/gallery
 * Get all gallery items
 */
router.get('/', async (req, res) => {
    try {
        const { category, type, page = 1, limit = 10 } = req.query;
        const where = { isActive: true };

        if (category) where.category = category;
        if (type) where.type = type;

        const offset = (page - 1) * limit;
        const { count, rows: gallery } = await Gallery.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: gallery || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ success: false, message: 'Error fetching gallery' });
    }
});

/**
 * GET /api/gallery/:id
 * Get gallery item by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const gallery = await Gallery.findByPk(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery item not found' });
        }

        res.json({ success: true, data: gallery });
    } catch (error) {
        console.error('Error fetching gallery item:', error);
        res.status(500).json({ success: false, message: 'Error fetching gallery item' });
    }
});

/**
 * GET /api/gallery/categories
 * Get gallery categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await Gallery.findAll({
            attributes: ['category', 'type'],
            group: ['category', 'type']
        });

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
});

/**
 * POST /api/gallery
 * Upload gallery item (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), upload.single('file'), [
    body('title').notEmpty(),
    body('category').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { title, description, category, type, visibility } = req.body;

        const gallery = await Gallery.create({
            title,
            description,
            category,
            type: type || 'image',
            visibility: visibility || 'public',
            imageUrl: req.file ? `/uploads/gallery/${req.file.filename}` : null,
            uploadedBy: req.user.id
        });

        res.status(201).json({ success: true, message: 'Gallery item uploaded', data: gallery });
    } catch (error) {
        console.error('Error uploading gallery item:', error);
        res.status(500).json({ success: false, message: 'Error uploading gallery item' });
    }
});

/**
 * PUT /api/gallery/:id
 * Update gallery item (admin)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const gallery = await Gallery.findByPk(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery item not found' });
        }

        const { title, description, category, type, visibility, isActive } = req.body;

        if (title) gallery.title = title;
        if (description) gallery.description = description;
        if (category) gallery.category = category;
        if (type) gallery.type = type;
        if (visibility) gallery.visibility = visibility;
        if (isActive !== undefined) gallery.isActive = isActive;

        await gallery.save();

        res.json({ success: true, message: 'Gallery item updated', data: gallery });
    } catch (error) {
        console.error('Error updating gallery item:', error);
        res.status(500).json({ success: false, message: 'Error updating gallery item' });
    }
});

/**
 * DELETE /api/gallery/:id
 * Delete gallery item (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const gallery = await Gallery.findByPk(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery item not found' });
        }

        // Delete image file if exists
        if (gallery.imageUrl) {
            const filePath = path.join(__dirname, '..', '..', gallery.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await gallery.destroy();

        res.json({ success: true, message: 'Gallery item deleted' });
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({ success: false, message: 'Error deleting gallery item' });
    }
});

module.exports = router;

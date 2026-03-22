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
        let query = { isActive: true };

        // Filter by visibility for non-authenticated users
        if (!req.user) {
            query.visibility = 'public';
        } else if (req.user.role === 'member') {
            query.visibility = { $in: ['public', 'members'] };
        }

        if (category) query.category = category;
        if (type) query.type = type;

        const galleries = await Gallery.find(query)
            .populate('createdBy', 'firstName lastName')
            .populate('event', 'title')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Gallery.countDocuments(query);

        res.json({
            success: true,
            data: galleries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching gallery' });
    }
});

/**
 * GET /api/gallery/featured
 * Get featured gallery items
 */
router.get('/featured', async (req, res) => {
    try {
        const query = { isActive: true, isFeatured: true };

        if (!req.user) {
            query.visibility = 'public';
        }

        const galleries = await Gallery.find(query)
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ success: true, data: galleries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching featured gallery' });
    }
});

/**
 * GET /api/gallery/:id
 * Get gallery by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const gallery = await Gallery.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('event', 'title')
            .populate('images.uploadedBy', 'firstName lastName');

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery not found' });
        }

        // Check visibility
        if (gallery.visibility !== 'public') {
            if (!req.user) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        // Increment view count
        gallery.viewCount += 1;
        await gallery.save();

        res.json({ success: true, data: gallery });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching gallery' });
    }
});

/**
 * POST /api/gallery
 * Create gallery (admin only)
 */
router.post('/', auth, authorize('admin', 'secretary'), [
    body('title').notEmpty().withMessage('Title is required'),
    body('type').notEmpty().withMessage('Type is required')
], validate, async (req, res) => {
    try {
        const { title, description, type, category, event, tags, visibility } = req.body;

        const gallery = new Gallery({
            title,
            description: description || '',
            type: type || 'image',
            category: category || 'other',
            event: event || null,
            tags: tags || [],
            visibility: visibility || 'members',
            createdBy: req.user._id
        });

        await gallery.save();

        res.status(201).json({
            success: true,
            message: 'Gallery created successfully',
            data: gallery
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating gallery' });
    }
});

/**
 * PUT /api/gallery/:id
 * Update gallery (admin only)
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const gallery = await Gallery.findById(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery not found' });
        }

        const { title, description, type, category, event, tags, visibility, isFeatured, isActive } = req.body;

        if (title) gallery.title = title;
        if (description !== undefined) gallery.description = description;
        if (type) gallery.type = type;
        if (category) gallery.category = category;
        if (event !== undefined) gallery.event = event;
        if (tags) gallery.tags = tags;
        if (visibility) gallery.visibility = visibility;
        if (isFeatured !== undefined) gallery.isFeatured = isFeatured;
        if (isActive !== undefined) gallery.isActive = isActive;

        await gallery.save();

        res.json({
            success: true,
            message: 'Gallery updated successfully',
            data: gallery
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating gallery' });
    }
});

/**
 * DELETE /api/gallery/:id
 * Delete gallery (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const gallery = await Gallery.findById(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery not found' });
        }

        // Delete associated images
        gallery.images.forEach(image => {
            const filePath = path.join(__dirname, '../../', image.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        await Gallery.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Gallery deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting gallery' });
    }
});

/**
 * POST /api/gallery/:id/images
 * Add images to gallery
 */
router.post('/:id/images', auth, authorize('admin', 'secretary'), upload.array('images', 20), async (req, res) => {
    try {
        const gallery = await Gallery.findById(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery not found' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        const { caption } = req.body;

        req.files.forEach(file => {
            gallery.images.push({
                url: '/uploads/gallery/' + file.filename,
                caption: caption || '',
                uploadedBy: req.user._id
            });
        });

        // Set first image as cover if not set
        if (!gallery.coverImage && gallery.images.length > 0) {
            gallery.coverImage = gallery.images[0].url;
        }

        await gallery.save();

        res.json({
            success: true,
            message: 'Images added successfully',
            data: gallery
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding images' });
    }
});

/**
 * DELETE /api/gallery/:id/images/:imageId
 * Delete image from gallery
 */
router.delete('/:id/images/:imageId', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const gallery = await Gallery.findById(req.params.id);

        if (!gallery) {
            return res.status(404).json({ success: false, message: 'Gallery not found' });
        }

        const imageIndex = gallery.images.findIndex(
            img => img._id.toString() === req.params.imageId
        );

        if (imageIndex === -1) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Delete file
        const imagePath = path.join(__dirname, '../../', gallery.images[imageIndex].url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        gallery.images.splice(imageIndex, 1);

        // Update cover image
        if (gallery.coverImage === gallery.images[imageIndex]?.url) {
            gallery.coverImage = gallery.images.length > 0 ? gallery.images[0].url : null;
        }

        await gallery.save();

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting image' });
    }
});

module.exports = router;

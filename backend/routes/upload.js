/**
 * Image Upload Routes
 * Handles image uploads for page editor
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/images';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpg|jpeg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only jpg, jpeg, png, gif, webp, and svg are allowed.'));
    }
});

/**
 * POST /api/upload/image
 * Upload an image for page content
 */
router.post('/image', auth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }

        // Return the public URL for the uploaded image
        const imageUrl = `/uploads/images/${req.file.filename}`;
        
        res.json({
            success: true,
            data: {
                url: imageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading image' 
        });
    }
});

/**
 * DELETE /api/upload/image
 * Delete an uploaded image
 */
router.delete('/image', auth, (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ 
                success: false, 
                message: 'No filename provided' 
            });
        }

        const filePath = path.join('uploads/images', filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Image deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Image not found' });
        }
    } catch (error) {
        console.error('Image delete error:', error);
        res.status(500).json({ success: false, message: 'Error deleting image' });
    }
});

module.exports = router;
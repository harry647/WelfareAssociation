/**
 * Document Routes
 * Handles document management and storage
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Document = require('../models/Document');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/documents';
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});

/**
 * GET /api/documents
 * Get all documents
 */
router.get('/', auth, async (req, res) => {
    try {
        const { category, visibility, search, page = 1, limit = 10 } = req.query;
        const where = { isArchived: false };

        if (category) where.category = category;

        const offset = (page - 1) * limit;
        const { count, rows: documents } = await Document.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: documents || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ success: false, message: 'Error fetching documents' });
    }
});

/**
 * GET /api/documents/category/:category
 * Get documents by category
 */
router.get('/category/:category', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const offset = (page - 1) * limit;
        const { count, rows: documents } = await Document.findAndCountAll({
            where: { category: req.params.category, isArchived: false },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: documents || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching documents by category:', error);
        res.status(500).json({ success: false, message: 'Error fetching documents' });
    }
});

/**
 * GET /api/documents/statistics
 * Get document statistics
 */
router.get('/statistics', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const total = await Document.count({ where: { isArchived: false } });
        const archived = await Document.count({ where: { isArchived: true } });
        
        const categories = await Document.findAll({
            attributes: ['category', [Document.sequelize.fn('COUNT', Document.sequelize.col('id')), 'count']],
            where: { isArchived: false },
            group: ['category']
        });

        res.json({ success: true, data: { total, archived, categories } });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/documents/dashboard
 * Get documentation dashboard data (summary for admin documentation page)
 */
router.get('/dashboard', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        // Get total documents
        const totalDocuments = await Document.count({ where: { isArchived: false } });
        
        // Get active policies count
        const { Policy } = require('../models');
        const activePolicies = await Policy.count({ where: { status: 'active' } });
        
        // Get categories breakdown
        const categories = await Document.findAll({
            attributes: ['category', [Document.sequelize.fn('COUNT', Document.sequelize.col('id')), 'count']],
            where: { isArchived: false },
            group: ['category']
        });
        
        // Get recent documents
        const recentDocuments = await Document.findAll({
            where: { isArchived: false },
            order: [['updatedAt', 'DESC']],
            limit: 10,
            attributes: ['id', 'name', 'category', 'mimeType', 'size', 'version', 'updatedAt']
        });
        
        // Get document access requests
        const DocumentRequest = require('../models/DocumentRequest');
        const User = require('../models/User');
        const Member = require('../models/Member');
        
        const documentRequests = await DocumentRequest.findAll({
            include: [
                { model: User, as: 'requester', attributes: ['firstName', 'lastName'] },
                { model: Document, as: 'document', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        // Calculate total downloads this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const documentsThisMonth = await Document.sum('downloadCount', {
            where: {
                isArchived: false,
                updatedAt: {
                    [Op.gte]: startOfMonth
                }
            }
        });
        
        // Format category data
        const categoryStats = {};
        categories.forEach(cat => {
            categoryStats[cat.category] = parseInt(cat.dataValues.count) || 0;
        });
        
        res.json({
            success: true,
            data: {
                totalDocuments: totalDocuments || 0,
                activePolicies: activePolicies || 0,
                documentsThisMonth: documentsThisMonth || 0,
                categories: categoryStats,
                recentDocuments: recentDocuments || [],
                documentRequests: documentRequests || [],
                recentUpdates: [] // Could be populated from a separate tracking system
            }
        });
    } catch (error) {
        console.error('Error fetching documentation dashboard:', error);
        res.status(500).json({ success: false, message: 'Error fetching documentation data' });
    }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        res.json({ success: true, data: document });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ success: false, message: 'Error fetching document' });
    }
});

/**
 * POST /api/documents
 * Upload document (admin)
 */
router.post('/', auth, authorize('admin', 'secretary'), upload.single('file'), [
    body('title').notEmpty(),
    body('category').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { title, description, category, visibility } = req.body;

        const document = await Document.create({
            title,
            description,
            category,
            visibility: visibility || 'members',
            fileUrl: req.file ? `/uploads/documents/${req.file.filename}` : null,
            fileName: req.file ? req.file.originalname : null,
            fileSize: req.file ? req.file.size : null,
            fileType: req.file ? req.file.mimetype : null,
            uploadedBy: req.user.id
        });

        res.status(201).json({ success: true, message: 'Document uploaded', data: document });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, message: 'Error uploading document' });
    }
});

/**
 * PUT /api/documents/:id
 * Update document
 */
router.put('/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const { title, description, category, visibility, isArchived } = req.body;

        if (title) document.title = title;
        if (description) document.description = description;
        if (category) document.category = category;
        if (visibility) document.visibility = visibility;
        if (isArchived !== undefined) document.isArchived = isArchived;

        await document.save();

        res.json({ success: true, message: 'Document updated', data: document });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ success: false, message: 'Error updating document' });
    }
});

/**
 * DELETE /api/documents/:id
 * Delete document (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Delete file if exists
        if (document.fileUrl) {
            const filePath = path.join(__dirname, '..', '..', document.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await document.destroy();

        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ success: false, message: 'Error deleting document' });
    }
});

module.exports = router;

/**
 * POST /api/documents/requests/:id
 * Approve or reject document access request
 */
router.post('/requests/:id', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const { status, responseNote } = req.body;
        const DocumentRequest = require('../models/DocumentRequest');
        
        const request = await DocumentRequest.findByPk(req.params.id);
        
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        request.status = status;
        request.responseNote = responseNote || '';
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        
        await request.save();
        
        res.json({ success: true, message: `Request ${status} successfully`, data: request });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ success: false, message: 'Error processing request' });
    }
});

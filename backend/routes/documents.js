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
        let query = { isArchived: false };

        // Filter by visibility
        if (req.user.role === 'member') {
            query.visibility = { $in: ['public', 'members'] };
        } else if (req.user.role === 'officer') {
            query.visibility = { $in: ['public', 'members', 'officers'] };
        }

        if (category) query.category = category;
        if (search) {
            query.$text = { $search: search };
        }

        const documents = await Document.find(query)
            .populate('uploadedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(query);

        res.json({
            success: true,
            data: documents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
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
        const query = { category: req.params.category, isArchived: false };

        const documents = await Document.find(query)
            .populate('uploadedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(query);

        res.json({
            success: true,
            data: documents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching documents by category' });
    }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'firstName lastName email')
            .populate('archivedBy', 'firstName lastName');

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Check visibility
        const roleHierarchy = { member: 1, officer: 2, admin: 3, chairman: 4 };
        const userLevel = roleHierarchy[req.user.role] || 0;
        const docLevel = roleHierarchy[document.visibility] || 0;

        if (userLevel < docLevel) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching document' });
    }
});

/**
 * POST /api/documents/upload
 * Upload document
 */
router.post('/upload', auth, upload.single('file'), [
    body('name').notEmpty().withMessage('Document name is required'),
    body('category').notEmpty().withMessage('Category is required')
], validate, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { name, description, category, visibility, tags } = req.body;

        const document = new Document({
            name,
            description: description || '',
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            category: category || 'other',
            visibility: visibility || 'members',
            uploadedBy: req.user._id,
            tags: tags ? JSON.parse(tags) : []
        });

        await document.save();

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: document
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error uploading document' });
    }
});

/**
 * PUT /api/documents/:id
 * Update document metadata
 */
router.put('/:id', auth, authorize('admin', 'officer'), async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const { name, description, category, visibility, tags } = req.body;

        if (name) document.name = name;
        if (description !== undefined) document.description = description;
        if (category) document.category = category;
        if (visibility) document.visibility = visibility;
        if (tags) document.tags = tags;

        await document.save();

        res.json({
            success: true,
            message: 'Document updated successfully',
            data: document
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating document' });
    }
});

/**
 * DELETE /api/documents/:id
 * Delete (archive) document
 */
router.delete('/:id', auth, authorize('admin', 'officer'), async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        document.isArchived = true;
        document.archivedAt = new Date();
        document.archivedBy = req.user._id;
        await document.save();

        res.json({ success: true, message: 'Document archived successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document' });
    }
});

/**
 * GET /api/documents/:id/download
 * Download document
 */
router.get('/:id/download', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Check visibility
        const roleHierarchy = { member: 1, officer: 2, admin: 3, chairman: 4 };
        const userLevel = roleHierarchy[req.user.role] || 0;
        const docLevel = roleHierarchy[document.visibility] || 0;

        if (userLevel < docLevel) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Increment download count
        document.downloadCount += 1;
        await document.save();

        const filePath = path.join(__dirname, '../../', document.path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        res.download(filePath, document.originalName);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error downloading document' });
    }
});

/**
 * POST /api/documents/:id/share
 * Share document with members
 */
router.post('/:id/share', auth, authorize('admin', 'officer'), [
    body('memberIds').isArray().withMessage('Member IDs array is required')
], validate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const { memberIds, permission = 'view' } = req.body;

        memberIds.forEach(memberId => {
            const exists = document.sharedWith.find(s => s.member.toString() === memberId);
            if (!exists) {
                document.sharedWith.push({ member: memberId, permission });
            }
        });

        await document.save();

        res.json({ success: true, message: 'Document shared successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sharing document' });
    }
});

/**
 * POST /api/documents/:id/revoke
 * Revoke document share
 */
router.post('/:id/revoke', auth, authorize('admin', 'officer'), [
    body('memberIds').isArray().withMessage('Member IDs array is required')
], validate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const { memberIds } = req.body;
        
        document.sharedWith = document.sharedWith.filter(
            s => !memberIds.includes(s.member.toString())
        );

        await document.save();

        res.json({ success: true, message: 'Share revoked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error revoking share' });
    }
});

/**
 * GET /api/documents/:id/versions
 * Get document versions
 */
router.get('/:id/versions', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        res.json({
            success: true,
            data: {
                currentVersion: document.version,
                versions: document.previousVersions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching versions' });
    }
});

/**
 * POST /api/documents/:id/versions/:versionId/restore
 * Restore document version
 */
router.post('/:id/versions/:versionId/restore', auth, authorize('admin', 'officer'), async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const version = document.previousVersions.find(
            v => v.version.toString() === req.params.versionId
        );

        if (!version) {
            return res.status(404).json({ success: false, message: 'Version not found' });
        }

        // Save current as previous version
        document.previousVersions.push({
            version: document.version,
            fileName: document.fileName,
            path: document.path,
            uploadedAt: new Date(),
            uploadedBy: req.user._id
        });

        // Restore version
        document.version += 1;
        document.fileName = version.fileName;
        document.path = version.path;

        await document.save();

        res.json({ success: true, message: 'Version restored successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error restoring version' });
    }
});

module.exports = router;

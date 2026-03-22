/**
 * Policy Routes
 * Handles organization policies and guidelines
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Policy = require('../models/Policy');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/policies
 * Get all policies
 */
router.get('/', async (req, res) => {
    try {
        const { category, status, search, page = 1, limit = 10 } = req.query;
        let query = {};

        // Public users can only see active and public policies
        if (!req.user) {
            query.status = 'active';
            query.isPublic = true;
        }

        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$text = { $search: search };
        }

        const policies = await Policy.find(query)
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Policy.countDocuments(query);

        res.json({
            success: true,
            data: policies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching policies' });
    }
});

/**
 * GET /api/policies/:id
 * Get policy by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .populate('reviewedBy', 'firstName lastName')
            .populate('relatedPolicies', 'title');

        if (!policy) {
            return res.status(404).json({ success: false, message: 'Policy not found' });
        }

        // Check access for non-public policies
        if (!policy.isPublic && policy.status !== 'active') {
            if (!req.user || !['admin', 'chairman', 'secretary'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        // Increment view count
        policy.viewCount += 1;
        await policy.save();

        res.json({ success: true, data: policy });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching policy' });
    }
});

/**
 * POST /api/policies
 * Create policy (admin only)
 */
router.post('/', auth, authorize('admin', 'chairman', 'secretary'), [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required')
], validate, async (req, res) => {
    try {
        const { title, content, category, version, effectiveDate, expiryDate, isPublic, relatedPolicies } = req.body;

        const policy = new Policy({
            title,
            content,
            category: category || 'general',
            version: version || '1.0',
            effectiveDate: effectiveDate || null,
            expiryDate: expiryDate || null,
            isPublic: isPublic || false,
            relatedPolicies: relatedPolicies || [],
            createdBy: req.user._id,
            status: 'draft'
        });

        await policy.save();

        res.status(201).json({
            success: true,
            message: 'Policy created successfully',
            data: policy
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating policy' });
    }
});

/**
 * PUT /api/policies/:id
 * Update policy (admin only)
 */
router.put('/:id', auth, authorize('admin', 'chairman', 'secretary'), async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id);

        if (!policy) {
            return res.status(404).json({ success: false, message: 'Policy not found' });
        }

        const { title, content, category, version, effectiveDate, expiryDate, isPublic, relatedPolicies, status } = req.body;

        if (title) policy.title = title;
        if (content) policy.content = content;
        if (category) policy.category = category;
        if (version) policy.version = version;
        if (effectiveDate !== undefined) policy.effectiveDate = effectiveDate;
        if (expiryDate !== undefined) policy.expiryDate = expiryDate;
        if (isPublic !== undefined) policy.isPublic = isPublic;
        if (relatedPolicies) policy.relatedPolicies = relatedPolicies;
        if (status) policy.status = status;
        
        policy.updatedBy = req.user._id;

        await policy.save();

        res.json({
            success: true,
            message: 'Policy updated successfully',
            data: policy
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating policy' });
    }
});

/**
 * DELETE /api/policies/:id
 * Delete policy (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const policy = await Policy.findByIdAndDelete(req.params.id);

        if (!policy) {
            return res.status(404).json({ success: false, message: 'Policy not found' });
        }

        res.json({ success: true, message: 'Policy deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting policy' });
    }
});

/**
 * POST /api/policies/:id/acknowledge
 * Acknowledge policy (user)
 */
router.post('/:id/acknowledge', auth, async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id);

        if (!policy) {
            return res.status(404).json({ success: false, message: 'Policy not found' });
        }

        if (!policy.requiresAcknowledgment) {
            return res.status(400).json({ success: false, message: 'This policy does not require acknowledgment' });
        }

        // Check if already acknowledged
        const alreadyAcknowledged = policy.acknowledgments.find(
            a => a.user.toString() === req.user._id.toString()
        );

        if (alreadyAcknowledged) {
            return res.status(400).json({ success: false, message: 'Policy already acknowledged' });
        }

        policy.acknowledgments.push({ user: req.user._id });
        await policy.save();

        res.json({ success: true, message: 'Policy acknowledged successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error acknowledging policy' });
    }
});

module.exports = router;

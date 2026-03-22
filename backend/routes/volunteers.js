/**
 * Volunteer Routes
 * Handles volunteer applications and management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Volunteer = require('../models/Volunteer');
const Member = require('../models/Member');
const { auth, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/volunteers
 * Get all volunteers (admin) or own volunteer records (member)
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, area, page = 1, limit = 10 } = req.query;
        let query = {};

        // Non-admin users only see their own records
        if (!['admin', 'chairman', 'secretary'].includes(req.user.role)) {
            query.user = req.user._id;
        }

        if (status) query.status = status;
        if (area) query.area = area;

        const volunteers = await Volunteer.find(query)
            .populate('member', 'firstName lastName memberNumber email phone')
            .populate('user', 'firstName lastName email')
            .populate('reviewedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Volunteer.countDocuments(query);

        res.json({
            success: true,
            data: volunteers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching volunteers' });
    }
});

/**
 * GET /api/volunteers/:id
 * Get volunteer by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id)
            .populate('member', 'firstName lastName memberNumber email phone')
            .populate('user', 'firstName lastName email')
            .populate('reviewedBy', 'firstName lastName')
            .populate('activities.recordedBy', 'firstName lastName')
            .populate('notes.addedBy', 'firstName lastName');

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        // Check access
        if (!['admin', 'chairman', 'secretary'].includes(req.user.role) && 
            volunteer.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: volunteer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching volunteer' });
    }
});

/**
 * POST /api/volunteers/apply
 * Apply to become a volunteer
 */
router.post('/apply', auth, [
    body('area').notEmpty().withMessage('Area is required'),
    body('motivation').notEmpty().withMessage('Motivation is required')
], validate, async (req, res) => {
    try {
        const { area, skills, availability, experience, motivation } = req.body;

        // Find member record
        const member = await Member.findOne({ userId: req.user._id });
        
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member record not found' });
        }

        // Check if already applied
        const existingApplication = await Volunteer.findOne({
            member: member._id,
            status: { $in: ['pending', 'active'] }
        });

        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'You already have an active volunteer application' });
        }

        const volunteer = new Volunteer({
            member: member._id,
            user: req.user._id,
            area,
            skills: skills || [],
            availability: availability || {},
            experience: experience || '',
            motivation,
            status: 'pending'
        });

        await volunteer.save();

        res.status(201).json({
            success: true,
            message: 'Volunteer application submitted successfully',
            data: volunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting volunteer application' });
    }
});

/**
 * PUT /api/volunteers/:id
 * Update volunteer application
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        // Only pending applications can be updated by the applicant
        if (volunteer.status !== 'pending' || volunteer.user.toString() !== req.user._id.toString()) {
            if (!['admin', 'chairman', 'secretary'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        const { area, skills, availability, experience, motivation } = req.body;

        if (area) volunteer.area = area;
        if (skills) volunteer.skills = skills;
        if (availability) volunteer.availability = availability;
        if (experience) volunteer.experience = experience;
        if (motivation) volunteer.motivation = motivation;

        await volunteer.save();

        res.json({
            success: true,
            message: 'Volunteer application updated successfully',
            data: volunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating volunteer application' });
    }
});

/**
 * PATCH /api/volunteers/:id/approve
 * Approve volunteer application
 */
router.patch('/:id/approve', auth, authorize('admin', 'chairman', 'secretary'), async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        if (volunteer.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Application is not pending' });
        }

        volunteer.status = 'approved';
        volunteer.reviewedBy = req.user._id;
        volunteer.reviewedAt = new Date();
        
        await volunteer.save();

        res.json({
            success: true,
            message: 'Volunteer application approved',
            data: volunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error approving volunteer application' });
    }
});

/**
 * PATCH /api/volunteers/:id/reject
 * Reject volunteer application
 */
router.patch('/:id/reject', auth, authorize('admin', 'chairman', 'secretary'), [
    body('reason').notEmpty().withMessage('Rejection reason is required')
], validate, async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        if (volunteer.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Application is not pending' });
        }

        volunteer.status = 'rejected';
        volunteer.reviewedBy = req.user._id;
        volunteer.reviewedAt = new Date();
        volunteer.rejectionReason = req.body.reason;
        
        await volunteer.save();

        res.json({
            success: true,
            message: 'Volunteer application rejected',
            data: volunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error rejecting volunteer application' });
    }
});

/**
 * DELETE /api/volunteers/:id
 * Delete volunteer record
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const volunteer = await Volunteer.findByIdAndDelete(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        res.json({ success: true, message: 'Volunteer record deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting volunteer record' });
    }
});

module.exports = router;

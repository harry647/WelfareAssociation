/**
 * Volunteer Routes
 * Handles volunteer applications and management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
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
        const where = {};

        // Non-admin users only see their own records
        if (!['admin', 'chairman', 'secretary'].includes(req.user.role)) {
            where.userId = req.user.id;
        }

        if (status) where.status = status;
        if (area) where.area = area;

        const offset = (page - 1) * limit;
        const { count, rows: volunteers } = await Volunteer.findAndCountAll({
            where,
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: volunteers || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ success: false, message: 'Error fetching volunteers' });
    }
});

/**
 * GET /api/volunteers/:id
 * Get volunteer by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const volunteer = await Volunteer.findByPk(req.params.id, {
            include: [
                { model: Member, as: 'member', attributes: ['firstName', 'lastName', 'memberNumber', 'email', 'phone'] }
            ]
        });

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        res.json({ success: true, data: volunteer });
    } catch (error) {
        console.error('Error fetching volunteer:', error);
        res.status(500).json({ success: false, message: 'Error fetching volunteer' });
    }
});

/**
 * GET /api/volunteers/statistics
 * Get volunteer statistics
 */
router.get('/statistics', auth, authorize('admin', 'chairman', 'secretary'), async (req, res) => {
    try {
        const total = await Volunteer.count();
        const active = await Volunteer.count({ where: { status: 'active' } });
        const pending = await Volunteer.count({ where: { status: 'pending' } });

        res.json({ success: true, data: { total, active, pending } });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * POST /api/volunteers
 * Apply to become a volunteer
 */
router.post('/', auth, [
    body('area').notEmpty(),
    body('availability').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { area, availability, skills, motivation } = req.body;

        // Find member
        const member = await Member.findOne({ where: { userId: req.user.id } });

        const volunteer = await Volunteer.create({
            memberId: member?.id,
            userId: req.user.id,
            area,
            availability,
            skills: skills || [],
            motivation,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Volunteer application submitted', data: volunteer });
    } catch (error) {
        console.error('Error creating volunteer:', error);
        res.status(500).json({ success: false, message: 'Error submitting volunteer application' });
    }
});

/**
 * PUT /api/volunteers/:id
 * Update volunteer status (admin)
 */
router.put('/:id', auth, authorize('admin', 'chairman', 'secretary'), async (req, res) => {
    try {
        const volunteer = await Volunteer.findByPk(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        const { area, availability, skills, status, hoursLogged, notes } = req.body;

        if (area) volunteer.area = area;
        if (availability) volunteer.availability = availability;
        if (skills) volunteer.skills = skills;
        if (status) volunteer.status = status;
        if (hoursLogged !== undefined) volunteer.hoursLogged = hoursLogged;
        if (notes) volunteer.notes = notes;

        await volunteer.save();

        res.json({ success: true, message: 'Volunteer updated', data: volunteer });
    } catch (error) {
        console.error('Error updating volunteer:', error);
        res.status(500).json({ success: false, message: 'Error updating volunteer' });
    }
});

/**
 * DELETE /api/volunteers/:id
 * Delete volunteer record (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const volunteer = await Volunteer.findByPk(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer record not found' });
        }

        await volunteer.destroy();

        res.json({ success: true, message: 'Volunteer deleted' });
    } catch (error) {
        console.error('Error deleting volunteer:', error);
        res.status(500).json({ success: false, message: 'Error deleting volunteer' });
    }
});

module.exports = router;

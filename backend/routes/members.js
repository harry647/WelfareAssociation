/**
 * Member Routes
 * Handles member CRUD operations
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Member = require('../models/Member');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * GET /api/members
 * Get all members (admin)
 */
router.get('/', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const where = {};
        
        // Build where clause
        if (status) {
            where.membershipStatus = status;
        }

        // Search functionality using Sequelize OR
        if (search) {
            where[require('sequelize').Op.or] = [
                { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { memberNumber: { [require('sequelize').Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows: members } = await Member.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: members,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching members'
        });
    }
});

/**
 * GET /api/members/statistics
 * Get member statistics (admin)
 */
router.get('/statistics', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const total = await Member.count();
        const active = await Member.count({ where: { membershipStatus: 'active' } });
        const inactive = await Member.count({ where: { membershipStatus: 'inactive' } });
        
        // Get members by type using Sequelize
        const byType = await Member.findAll({
            attributes: [
                ['membershipType', 'membershipType'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['membershipType']
        });

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive,
                byType: byType.map(item => ({
                    _id: item.membershipType,
                    count: parseInt(item.dataValues.count)
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

/**
 * GET /api/members/:id
 * Get member by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const member = await Member.findById(req.params.id)
            .populate('userId', 'email role');

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Check if user has permission
        if (req.user.role !== 'admin' && 
            req.user.role !== 'secretary' && 
            req.user.memberId?.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: member
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching member'
        });
    }
});

/**
 * POST /api/members
 * Create new member (admin)
 */
router.post('/', auth, authorize('admin'), [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('email').isEmail(),
    body('phone').optional().trim(),
    validate
], async (req, res) => {
    try {
        const { firstName, lastName, email, phone, dateOfBirth, gender, address, membershipType } = req.body;

        // Check if email exists
        const existingMember = await Member.findOne({ email });
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'Member with this email already exists'
            });
        }

        const member = await Member.create({
            userId: req.user._id,
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            membershipType
        });

        res.status(201).json({
            success: true,
            message: 'Member created successfully',
            data: member
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating member'
        });
    }
});

/**
 * PUT /api/members/:id
 * Update member
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, dateOfBirth, gender, address, emergencyContact, nextOfKin } = req.body;

        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Check permission
        if (req.user.role !== 'admin' && 
            req.user.memberId?.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update fields
        if (firstName) member.firstName = firstName;
        if (lastName) member.lastName = lastName;
        if (phone) member.phone = phone;
        if (dateOfBirth) member.dateOfBirth = dateOfBirth;
        if (gender) member.gender = gender;
        if (address) member.address = address;
        if (emergencyContact) member.emergencyContact = emergencyContact;
        if (nextOfKin) member.nextOfKin = nextOfKin;

        await member.save();

        res.json({
            success: true,
            message: 'Member updated successfully',
            data: member
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating member'
        });
    }
});

/**
 * DELETE /api/members/:id
 * Delete member (admin)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Delete associated user if exists
        if (member.userId) {
            await User.findByIdAndDelete(member.userId);
        }

        await Member.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Member deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting member'
        });
    }
});

/**
 * GET /api/members/:id/contributions
 * Get member's contributions
 */
router.get('/:id/contributions', auth, async (req, res) => {
    try {
        const Contribution = require('../models/Contribution');
        
        const contributions = await Contribution.find({ member: req.params.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: contributions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching contributions'
        });
    }
});

/**
 * GET /api/members/:id/loans
 * Get member's loans
 */
router.get('/:id/loans', auth, async (req, res) => {
    try {
        const Loan = require('../models/Loan');
        
        const loans = await Loan.find({ member: req.params.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: loans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching loans'
        });
    }
});

module.exports = router;

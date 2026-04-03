/**
 * Officer Routes
 * Handles officer CRUD operations and account management
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Officer, Member, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
    console.log('🔍 VALIDATION DEBUG: Running validation...');
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.log('❌ VALIDATION DEBUG: Validation failed:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    
    console.log('✅ VALIDATION DEBUG: Validation passed');
    next();
};

/**
 * POST /api/officers/create-account
 * Create officer account and appointment
 */
router.post('/create-account', (req, res, next) => {
    console.log('🎯 Officers route hit! Method:', req.method, 'Path:', req.path);
    console.log('🎯 Headers:', req.headers);
    next();
}, auth, authorize('admin'), [
    body('memberId').notEmpty().withMessage('Member ID is required'),
    body('position').isIn(['chairman', 'vice-chairman', 'secretary', 'treasurer', 'pro', 'committee-head', 'member'])
        .withMessage('Valid position is required'),
    body('role').isIn(['admin', 'executive']).withMessage('Valid role is required'),
    body('startDate').isDate().withMessage('Valid start date is required'),
    body('department').optional().isIn(['finance', 'events', 'welfare', 'academic', 'sports', 'communications']),
    body('endDate').optional().custom((value) => {
    if (!value) return true; // Allow null/undefined
    // If value exists, check if it's a valid date
    const date = new Date(value);
    return !isNaN(date.getTime());
}).withMessage('Valid end date format required'),
    body('accountData.email').isEmail().withMessage('Valid email is required'),
    body('accountData.password').notEmpty().withMessage('Password is required'),
    body('accountData.accountStatus').optional().isIn(['active', 'pending']),
    validate
], async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            console.log('❌ Authentication failed: No user in request');
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            console.log('❌ Authorization failed: User role is', req.user.role);
            return res.status(403).json({
                success: false,
                message: 'Admin access required to create officer accounts.'
            });
        }

        console.log('✅ User authenticated:', { id: req.user.id, email: req.user.email, role: req.user.role });
        console.log('🔍 DEBUG: Received request body:', JSON.stringify(req.body, null, 2));
        
        // Check if this is a validation error by checking if we reach here
        console.log('🚀 About to proceed with officer creation logic...');
        
        const {
            memberId,
            memberData,
            position,
            role,
            department,
            startDate,
            endDate,
            accountData,
            notifications,
            notes
        } = req.body;

        console.log('🔍 DEBUG: Extracted data:', {
            memberId,
            position,
            role,
            department,
            startDate,
            endDate,
            accountEmail: accountData?.email,
            accountPassword: accountData?.password ? '***' : 'missing'
        });

        console.log('Creating officer account:', { memberId, position, role });

        // Check if member exists
        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Check if member is already an officer
        const existingOfficer = await Officer.findOne({
            where: {
                memberId: memberId,
                status: 'active'
            }
        });

        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Member is already an active officer'
            });
        }

        // Check if member already has a user account
        let existingUser = await User.findOne({
            where: { email: accountData.email }
        });

        if (existingUser) {
            console.log('🔍 Member already has user account:', existingUser.email);
            
            // Update existing user's role and status
            await existingUser.update({
                role: role,
                status: accountData.accountStatus || 'active',
                forcePasswordChange: accountData.forcePasswordChange || true
            });
            
            console.log('✅ Updated existing user account for officer');
        } else {
            // Create new user account for the officer
            const hashedPassword = await bcrypt.hash(accountData.password, 12);

            existingUser = await User.create({
                email: accountData.email,
                password: hashedPassword,
                role: role,
                status: accountData.accountStatus || 'pending',
                memberId: memberId,
                forcePasswordChange: accountData.forcePasswordChange || true
            });

            console.log('✅ Created new user account for officer');
        }

        // Create officer record
        const officer = await Officer.create({
            memberId: memberId,
            userId: existingUser.id,
            position: position,
            role: role,
            department: department || null,
            startDate: startDate,
            endDate: endDate || null,
            status: 'active',
            accountStatus: accountData.accountStatus || 'pending',
            memberDataSnapshot: memberData,
            accountData: accountData,
            notifications: notifications || {},
            notes: notes || null,
            appointedBy: req.user.id,
            appointmentDate: new Date()
        });

        console.log('Officer record created:', officer.id);

        // Update member to reflect officer status if needed
        await member.update({
            notes: member.notes ? 
                `${member.notes}\nAppointed as ${position} on ${new Date().toLocaleDateString()}` :
                `Appointed as ${position} on ${new Date().toLocaleDateString()}`
        });

        res.status(201).json({
            success: true,
            message: 'Officer account created successfully',
            data: {
                officer: {
                    id: officer.id,
                    position: officer.position,
                    role: officer.role,
                    department: officer.department,
                    startDate: officer.startDate,
                    endDate: officer.endDate,
                    status: officer.status,
                    accountStatus: officer.accountStatus
                },
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    role: existingUser.role,
                    status: existingUser.status
                },
                member: {
                    id: member.id,
                    name: member.getFullName(),
                    email: member.email,
                    memberNumber: member.memberNumber
                }
            }
        });

    } catch (error) {
        console.error('❌ Error creating officer account:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // If it's a validation error, return more details
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message,
                    value: err.value
                }))
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating officer account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/officers
 * Get all officers (admin only)
 */
router.get('/', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const { page = 1, limit = 10, status, role, position } = req.query;
        const where = {};

        // Build where clause
        if (status) where.status = status;
        if (role) where.role = role;
        if (position) where.position = position;

        const offset = (page - 1) * limit;
        const { count, rows: officers } = await Officer.findAndCountAll({
            where,
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['firstName', 'lastName', 'email', 'memberNumber']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'role', 'isActive']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: officers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching officers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching officers'
        });
    }
});

/**
 * GET /api/officers/:id
 * Get officer by ID
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const officer = await Officer.findByPk(req.params.id, {
            include: [
                {
                    model: Member,
                    as: 'member',
                    attributes: ['firstName', 'lastName', 'email', 'phone', 'memberNumber']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'role', 'status', 'createdAt']
                }
            ]
        });

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && 
            req.user.role !== 'secretary' && 
            req.user.id !== officer.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: officer
        });
    } catch (error) {
        console.error('Error fetching officer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching officer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/officers/:id
 * Update officer (admin only)
 */
router.put('/:id', auth, authorize('admin'), [
    body('position').optional().isIn(['chairman', 'vice-chairman', 'secretary', 'treasurer', 'pro', 'committee-head', 'member']),
    body('role').optional().isIn(['admin', 'executive']),
    body('department').optional().isIn(['finance', 'events', 'welfare', 'academic', 'sports', 'communications']),
    body('status').optional().isIn(['active', 'inactive', 'suspended', 'terminated']),
    body('accountStatus').optional().isIn(['active', 'pending', 'suspended']),
    body('startDate').optional().isDate(),
    body('endDate').optional().isDate(),
    validate
], async (req, res) => {
    try {
        const officer = await Officer.findByPk(req.params.id);

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        const {
            position,
            role,
            department,
            status,
            accountStatus,
            startDate,
            endDate,
            notes
        } = req.body;

        // Update fields
        if (position) officer.position = position;
        if (role) {
            officer.role = role;
            // Also update user role if user exists
            if (officer.userId) {
                await User.update({ role }, { where: { id: officer.userId } });
            }
        }
        if (department !== undefined) officer.department = department;
        if (status) officer.status = status;
        if (accountStatus) officer.accountStatus = accountStatus;
        if (startDate) officer.startDate = startDate;
        if (endDate !== undefined) officer.endDate = endDate;
        if (notes !== undefined) officer.notes = notes;

        await officer.save();

        res.json({
            success: true,
            message: 'Officer updated successfully',
            data: officer
        });
    } catch (error) {
        console.error('Error updating officer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating officer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/officers/:id
 * Delete officer (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const officer = await Officer.findByPk(req.params.id);

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Delete associated user if exists
        if (officer.userId) {
            await User.destroy({ where: { id: officer.userId } });
        }

        await Officer.destroy({ where: { id: req.params.id } });

        res.json({
            success: true,
            message: 'Officer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting officer:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting officer'
        });
    }
});

module.exports = router;

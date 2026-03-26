/**
 * User Routes
 * Handles user profile and settings
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
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
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', auth, async (req, res) => {
    try {
        // Check if req.user is a Sequelize model instance or a plain object (mock admin)
        // Plain objects (like the mock admin) don't have the 'get' method
        const isSequelizeInstance = req.user && typeof req.user.get === 'function';
        
        let user;
        let member = null;
        
        if (isSequelizeInstance) {
            // Regular user - fetch from database
            user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] }
            });
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Get associated member if exists
            member = await Member.findOne({ where: { userId: user.id } });
        } else {
            // Mock admin user (plain object) - use directly
            user = req.user;
            // Remove password from response if present
            if (user.password) {
                delete user.password;
            }
        }

        res.json({
            success: true,
            data: {
                user,
                member
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put('/profile', auth, [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty')
], validate, async (req, res) => {
    try {
        const { firstName, lastName, phone, avatar } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

/**
 * PUT /api/users/password
 * Change password
 */
router.put('/password', auth, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], validate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating password' });
    }
});

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (role) query.role = role;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

/**
 * GET /api/users/executive-team
 * Get all executive team members (users with admin roles)
 */
router.get('/executive-team', auth, authorize('admin', 'secretary', 'treasurer', 'chairman'), async (req, res) => {
    try {
        // Get users with executive roles
        const executives = await User.findAll({
            where: {
                role: {
                    [require('sequelize').Op.in]: ['admin', 'chairman', 'treasurer', 'secretary']
                },
                isActive: true
            },
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'memberId', 'isActive', 'createdAt'],
            order: [
                ['role', 'ASC'],
                ['firstName', 'ASC']
            ]
        });

        // Get associated member details for each executive
        const executiveMembers = await Promise.all(
            executives.map(async (user) => {
                let memberInfo = null;
                if (user.memberId) {
                    memberInfo = await Member.findOne({
                        where: { id: user.memberId },
                        attributes: ['id', 'memberNumber', 'firstName', 'lastName', 'email', 'phone', 'institution']
                    });
                }
                return {
                    userId: user.id,
                    memberId: user.memberId,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    memberNumber: memberInfo?.memberNumber || null,
                    studentId: memberInfo?.institution?.studentId || null
                };
            })
        );

        res.json({
            success: true,
            data: executiveMembers
        });
    } catch (error) {
        console.error('Error fetching executive team:', error);
        res.status(500).json({ success: false, message: 'Error fetching executive team' });
    }
});

/**
 * GET /api/users/:id
 * Get user by ID (admin only)
 */
router.get('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const member = await Member.findOne({ userId: user._id });

        res.json({
            success: true,
            data: {
                user,
                member
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
});

/**
 * PUT /api/users/:id
 * Update user (admin only)
 */
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { role, isActive, firstName, lastName, phone } = req.body;

        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        // Prevent self-deletion
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

module.exports = router;

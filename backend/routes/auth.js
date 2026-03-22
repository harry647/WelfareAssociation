/**
 * Authentication Routes
 * Handles login, registration, logout, and password management
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Member = require('../models/Member');
const { generateTokens, verifyToken, auth } = require('../middleware/auth');

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
 * POST /api/auth/register
 * Register a new user and member
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('phone').optional().trim(),
    validate
], async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            phone,
            role: 'member'
        });

        // Create member profile
        const member = await Member.create({
            userId: user._id,
            firstName,
            lastName,
            email,
            phone,
            memberNumber: `SWA${Date.now()}`
        });

        // Link member to user
        user.memberId = member._id;
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Get member data
        const member = await Member.findById(user.memberId);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                member: member ? {
                    id: member._id,
                    memberNumber: member.memberNumber,
                    firstName: member.firstName,
                    lastName: member.lastName
                } : null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', auth, async (req, res) => {
    // In a real app, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);
        
        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user._id);

        res.json({
            success: true,
            ...tokens
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = req.user;
        const member = await Member.findById(user.memberId);

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                lastLogin: user.lastLogin
            },
            member
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', auth, [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
    validate
], async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = req.user;

        // Update user
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        await user.save();

        // Update member if exists
        if (user.memberId) {
            await Member.findByIdAndUpdate(user.memberId, {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone && { phone })
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password', auth, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validate
], async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});

module.exports = router;

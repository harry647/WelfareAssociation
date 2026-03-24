/**
 * Authentication Routes
 * Handles login, registration, logout, and password management
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
    body('securityQuestion').optional().trim(),
    body('securityAnswer').optional().trim(),
    validate
], async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, securityQuestion, securityAnswer } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash security answer before storing
        let hashedSecurityAnswer = null;
        if (securityAnswer) {
            const salt = await bcrypt.genSalt(10);
            hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), salt);
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            phone,
            role: 'member',
            securityQuestion,
            securityAnswer: hashedSecurityAnswer
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
 * User login - supports both admin (from .env) and database users
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if this is an admin login (from .env)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@swa.org';
        const adminPassword = process.env.ADMIN_PASSWORD || 'SWAAdmin2024!';
        
        if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
            // Admin login - return success without database lookup
            const { accessToken, refreshToken } = generateTokens('admin');
            
            return res.json({
                success: true,
                message: 'Login successful',
                token: accessToken,
                refreshToken,
                user: {
                    id: 'admin',
                    email: email,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin'
                }
            });
        }

        // Find user with password using Sequelize
        const user = await User.findOne({
            where: { email }
        });
        
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

/**
 * POST /api/auth/forgot-password
 * Verify email and get security question for password reset
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail(),
    validate
], async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            // Return success for security (don't reveal if email exists)
            return res.json({
                success: true,
                message: 'If the email exists, a security question will be presented'
            });
        }

        // Check if user has a security question set
        if (!user.securityQuestion || !user.securityAnswer) {
            return res.json({
                success: false,
                message: 'This account does not have a security question set. Please contact support.'
            });
        }

        // Return success with security question
        res.json({
            success: true,
            securityQuestion: user.securityQuestion
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
});

/**
 * POST /api/auth/verify-security-answer
 * Verify security answer for password reset
 */
router.post('/verify-security-answer', [
    body('email').isEmail().normalizeEmail(),
    body('answer').notEmpty().trim(),
    validate
], async (req, res) => {
    try {
        const { email, answer } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify security answer (case-insensitive comparison)
        const isMatch = await bcrypt.compare(answer.toLowerCase(), user.securityAnswer);
        
        if (!isMatch) {
            return res.json({
                success: false,
                message: 'Incorrect security answer'
            });
        }

        res.json({
            success: true,
            message: 'Security answer verified successfully'
        });
    } catch (error) {
        console.error('Security verification error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password after security verification
 */
router.post('/reset-password', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('password').matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
    body('password').matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter'),
    body('password').matches(/\d/).withMessage('Password must contain at least one number'),
    body('password').matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),
    validate
], async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password
        user.password = hashedPassword;
        
        // Clear any existing password reset tokens
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resetting password. Please try again.'
        });
    }
});

module.exports = router;

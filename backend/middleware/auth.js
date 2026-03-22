/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
};

/**
 * Verify JWT access token
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Authentication middleware - protects routes
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please log in.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);
        
        // Get user from database
        const user = await User.findById(decoded.userId).populate('memberId');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated.'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId).populate('memberId');
            
            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    generateTokens,
    verifyToken,
    auth,
    authorize,
    optionalAuth
};

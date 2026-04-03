/**
 * Settings Routes
 * Manage system configuration including payment settings
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Settings = require('../models/Settings');
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
 * GET /api/settings
 * Get all settings or filter by category
 */
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const where = {};
        
        if (category) {
            where.category = category;
        }
        
        const settings = await Settings.findAll({
            where,
            order: [['category', 'ASC'], ['key', 'ASC']]
        });
        
        // Convert to key-value format
        const settingsMap = {};
        settings.forEach(setting => {
            let value = setting.value;
            
            // Parse based on type
            if (setting.type === 'number') {
                value = parseFloat(setting.value) || 0;
            } else if (setting.type === 'boolean') {
                value = setting.value === 'true';
            } else if (setting.type === 'json') {
                try {
                    value = JSON.parse(setting.value);
                } catch (e) {
                    value = setting.value;
                }
            }
            
            settingsMap[setting.key] = value;
        });
        
        res.json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.json({
            success: false,
            data: {}
        });
    }
});

/**
 * GET /api/settings/:key
 * Get a specific setting
 */
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        
        const setting = await Settings.findOne({ where: { key } });
        
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }
        
        res.json({
            success: true,
            data: setting
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching setting'
        });
    }
});

/**
 * PUT /api/settings
 * Update settings (admin only)
 */
router.put('/', auth, authorize('admin'), [
    body('key').notEmpty().withMessage('Setting key is required'),
    body('value').optional()
], validate, async (req, res) => {
    try {
        const { key, value, type, category, description } = req.body;
        
        // Check if setting exists
        let setting = await Settings.findOne({ where: { key } });
        
        if (setting) {
            // Update
            setting.value = value;
            if (type) setting.type = type;
            if (category) setting.category = category;
            if (description) setting.description = description;
            await setting.save();
        } else {
            // Create new
            setting = await Settings.create({
                key,
                value,
                type: type || 'string',
                category: category || 'general',
                description,
                updatedBy: req.user.id
            });
        }
        
        res.json({
            success: true,
            data: setting,
            message: 'Setting updated successfully'
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating setting'
        });
    }
});

/**
 * POST /api/settings/bulk
 * Update multiple settings at once (admin only)
 */
router.post('/bulk', auth, authorize('admin'), [
    body('settings').isArray().withMessage('Settings array is required')
], validate, async (req, res) => {
    try {
        const { settings } = req.body;
        
        const results = [];
        
        for (const item of settings) {
            let setting = await Settings.findOne({ where: { key: item.key } });
            
            if (setting) {
                setting.value = item.value;
                setting.updatedBy = req.user.id;
                await setting.save();
            } else {
                setting = await Settings.create({
                    key: item.key,
                    value: item.value,
                    type: item.type || 'string',
                    category: item.category || 'general',
                    description: item.description,
                    updatedBy: req.user.id
                });
            }
            
            results.push(setting);
        }
        
        res.json({
            success: true,
            data: results,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings'
        });
    }
});

/**
 * GET /api/settings/payment/config
 * Get payment configuration (merged from DB + env fallback)
 */
router.get('/payment/config', async (req, res) => {
    try {
        // Get settings from database
        const dbSettings = await Settings.findAll({
            where: { category: 'payment' }
        });
        
        const paymentConfig = {};
        dbSettings.forEach(setting => {
            paymentConfig[setting.key] = setting.value;
        });
        
        // Merge with env fallback
        const config = {
            mpesa: {
                enabled: paymentConfig.mpesa_enabled === 'true' || !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_KEY !== 'your_mpesa_consumer_key_here'),
                consumerKey: paymentConfig.mpesa_consumer_key || process.env.MPESA_CONSUMER_KEY || '',
                consumerSecret: paymentConfig.mpesa_consumer_secret || process.env.MPESA_CONSUMER_SECRET || '',
                shortcode: paymentConfig.mpesa_shortcode || process.env.MPESA_SHORTCODE || '',
                paybill: paymentConfig.mpesa_paybill || process.env.MPESA_PAYBILL || '',
                callbackUrl: paymentConfig.mpesa_callback_url || process.env.MPESA_CALLBACK_URL || ''
            },
            stripe: {
                enabled: paymentConfig.stripe_enabled === 'true' || !!(process.env.STRIPE_PUBLIC_KEY && process.env.STRIPE_PUBLIC_KEY.startsWith('pk_')),
                publicKey: paymentConfig.stripe_public_key || process.env.STRIPE_PUBLIC_KEY || '',
                secretKey: paymentConfig.stripe_secret_key || process.env.STRIPE_SECRET_KEY || '',
                webhookSecret: paymentConfig.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || ''
            },
            flutterwave: {
                enabled: paymentConfig.flw_enabled === 'true' || !!(process.env.FLW_PUBLIC_KEY && process.env.FLW_PUBLIC_KEY !== 'your_flutterwave_public_key'),
                publicKey: paymentConfig.flw_public_key || process.env.FLW_PUBLIC_KEY || '',
                secretKey: paymentConfig.flw_secret_key || process.env.FLW_SECRET_KEY || '',
                secretHash: paymentConfig.flw_secret_hash || process.env.FLW_SECRET_HASH || ''
            },
            bank: {
                enabled: paymentConfig.bank_enabled === 'true' || !!(process.env.BANK_ACCOUNT_NUMBER && process.env.BANK_ACCOUNT_NUMBER !== '1234567890'),
                name: paymentConfig.bank_name || process.env.BANK_NAME || 'Kenya Commercial Bank',
                accountName: paymentConfig.bank_account_name || process.env.BANK_ACCOUNT_NAME || 'SWA JOOUST',
                accountNumber: paymentConfig.bank_account_number || process.env.BANK_ACCOUNT_NUMBER || '',
                branch: paymentConfig.bank_branch || process.env.BANK_BRANCH || ''
            }
        };
        
        // Determine available methods
        const availableMethods = [];
        if (config.mpesa.enabled) availableMethods.push('mpesa');
        if (config.stripe.enabled) availableMethods.push('card');
        if (config.flutterwave.enabled) availableMethods.push('flutterwave');
        if (config.bank.enabled) availableMethods.push('bank');
        
        res.json({
            success: true,
            data: {
                ...config,
                availableMethods
            }
        });
    } catch (error) {
        console.error('Error fetching payment config:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment configuration'
        });
    }
});

/**
 * PUT /api/settings/payment/config
 * Update payment configuration (admin only)
 */
router.put('/payment/config', auth, authorize('admin'), async (req, res) => {
    try {
        const { mpesa, stripe, flutterwave, bank } = req.body;
        const userId = req.user.id;
        
        const settingsToUpdate = [];
        
        // M-Pesa settings
        if (mpesa) {
            settingsToUpdate.push(
                { key: 'mpesa_enabled', value: String(mpesa.enabled), type: 'boolean', category: 'payment', description: 'Enable M-Pesa payments' },
                { key: 'mpesa_consumer_key', value: mpesa.consumerKey || '', type: 'string', category: 'payment', description: 'M-Pesa Consumer Key', isEncrypted: false },
                { key: 'mpesa_consumer_secret', value: mpesa.consumerSecret || '', type: 'string', category: 'payment', description: 'M-Pesa Consumer Secret', isEncrypted: true },
                { key: 'mpesa_shortcode', value: mpesa.shortcode || '', type: 'string', category: 'payment', description: 'M-Pesa Business Shortcode' },
                { key: 'mpesa_paybill', value: mpesa.paybill || '', type: 'string', category: 'payment', description: 'M-Pesa Paybill Number' },
                { key: 'mpesa_callback_url', value: mpesa.callbackUrl || '', type: 'string', category: 'payment', description: 'M-Pesa Callback URL' }
            );
        }
        
        // Stripe settings
        if (stripe) {
            settingsToUpdate.push(
                { key: 'stripe_enabled', value: String(stripe.enabled), type: 'boolean', category: 'payment', description: 'Enable Stripe payments' },
                { key: 'stripe_public_key', value: stripe.publicKey || '', type: 'string', category: 'payment', description: 'Stripe Public Key' },
                { key: 'stripe_secret_key', value: stripe.secretKey || '', type: 'string', category: 'payment', description: 'Stripe Secret Key', isEncrypted: true },
                { key: 'stripe_webhook_secret', value: stripe.webhookSecret || '', type: 'string', category: 'payment', description: 'Stripe Webhook Secret' }
            );
        }
        
        // Flutterwave settings
        if (flutterwave) {
            settingsToUpdate.push(
                { key: 'flw_enabled', value: String(flutterwave.enabled), type: 'boolean', category: 'payment', description: 'Enable Flutterwave payments' },
                { key: 'flw_public_key', value: flutterwave.publicKey || '', type: 'string', category: 'payment', description: 'Flutterwave Public Key' },
                { key: 'flw_secret_key', value: flutterwave.secretKey || '', type: 'string', category: 'payment', description: 'Flutterwave Secret Key', isEncrypted: true },
                { key: 'flw_secret_hash', value: flutterwave.secretHash || '', type: 'string', category: 'payment', description: 'Flutterwave Secret Hash' }
            );
        }
        
        // Bank settings
        if (bank) {
            settingsToUpdate.push(
                { key: 'bank_enabled', value: String(bank.enabled), type: 'boolean', category: 'payment', description: 'Enable bank transfer' },
                { key: 'bank_name', value: bank.name || '', type: 'string', category: 'payment', description: 'Bank Name' },
                { key: 'bank_account_name', value: bank.accountName || '', type: 'string', category: 'payment', description: 'Bank Account Name' },
                { key: 'bank_account_number', value: bank.accountNumber || '', type: 'string', category: 'payment', description: 'Bank Account Number' },
                { key: 'bank_branch', value: bank.branch || '', type: 'string', category: 'payment', description: 'Bank Branch' }
            );
        }
        
        // Update all settings
        for (const item of settingsToUpdate) {
            let setting = await Settings.findOne({ where: { key: item.key } });
            
            if (setting) {
                setting.value = item.value;
                setting.updatedBy = userId;
                await setting.save();
            } else {
                await Settings.create({
                    ...item,
                    updatedBy: userId
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Payment configuration updated successfully'
        });
    } catch (error) {
        console.error('Error updating payment config:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment configuration'
        });
    }
});

/**
 * GET /api/settings/security
 * Get security settings
 */
router.get('/security', auth, authorize('admin'), async (req, res) => {
    try {
        const securitySettings = await Settings.findAll({
            where: { category: 'security' }
        });
        
        const settingsMap = {};
        securitySettings.forEach(setting => {
            let value = setting.value;
            
            if (setting.type === 'number') {
                value = parseFloat(setting.value) || 0;
            } else if (setting.type === 'boolean') {
                value = setting.value === 'true';
            } else if (setting.type === 'json') {
                try {
                    value = JSON.parse(setting.value);
                } catch (e) {
                    value = setting.value;
                }
            }
            
            settingsMap[setting.key] = value;
        });
        
        res.json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        console.error('Error fetching security settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching security settings'
        });
    }
});

/**
 * PUT /api/settings/security
 * Update security settings (admin only)
 */
router.put('/security', auth, authorize('admin'), [
    body('settings').isArray().withMessage('Settings array is required')
], validate, async (req, res) => {
    try {
        const { settings } = req.body;
        const userId = req.user.id;
        
        for (const item of settings) {
            let setting = await Settings.findOne({ where: { key: item.key } });
            
            if (setting) {
                setting.value = item.value;
                setting.updatedBy = userId;
                await setting.save();
            } else {
                await Settings.create({
                    key: item.key,
                    value: item.value,
                    type: item.type || 'string',
                    category: 'security',
                    description: item.description,
                    updatedBy: userId
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Security settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating security settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating security settings'
        });
    }
});

/**
 * GET /api/settings/security/stats
 * Get security statistics
 */
router.get('/security/stats', auth, authorize('admin'), async (req, res) => {
    try {
        const User = require('../models/User');
        
        // Get user statistics
        const totalUsers = await User.count();
        const activeUsers = await User.count({
            where: {
                isActive: true,
                lastLogin: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });
        
        const usersWith2FA = await User.count({
            where: {
                isEmailVerified: true
            }
        });
        
        // Get failed login attempts (this would need to be tracked separately)
        const failedLogins = 0; // Placeholder - would need audit log table
        
        // Calculate days since last audit
        const lastAuditSetting = await Settings.findOne({
            where: { key: 'last_security_audit' }
        });
        
        let lastAuditDays = 0;
        if (lastAuditSetting && lastAuditSetting.value) {
            const lastAuditDate = new Date(lastAuditSetting.value);
            const diffTime = Math.abs(new Date() - lastAuditDate);
            lastAuditDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        res.json({
            success: true,
            data: {
                activeUsers,
                twoFactorEnabled: usersWith2FA,
                failedLogins,
                lastAuditDays,
                totalUsers
            }
        });
    } catch (error) {
        console.error('Error fetching security stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching security statistics'
        });
    }
});

/**
 * GET /api/settings/security/audit-log
 * Get security audit log
 */
router.get('/security/audit-log', auth, authorize('admin'), async (req, res) => {
    try {
        // This would typically come from an audit log table
        // For now, we'll return a sample structure
        const auditLogs = []; // Placeholder - would need audit log table
        
        res.json({
            success: true,
            data: auditLogs
        });
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit log'
        });
    }
});

module.exports = router;
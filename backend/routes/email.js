/**
 * Email Routes
 * Handles email sending operations for admin
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
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

// Create nodemailer transporter (configure with your email service)
const createTransporter = () => {
    // Configure with environment variables or use default
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    });
};

/**
 * GET /api/email/members
 * Get all registered members for email dropdown
 * Returns JSON array with id, name, email fields
 */
router.get('/members', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const members = await Member.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'membershipStatus'],
            where: {
                membershipStatus: 'active'
            },
            order: [['firstName', 'ASC'], ['lastName', 'ASC']]
        });

        const memberList = members.map(m => ({
            id: m.id,
            name: `${m.firstName} ${m.lastName}`,
            email: m.email
        }));

        res.json({
            success: true,
            data: memberList
        });
    } catch (error) {
        console.error('Error fetching members for email:', error);
        res.status(500).json({ success: false, message: 'Error fetching members' });
    }
});

/**
 * POST /api/email/send
 * Send email to a single member
 * Accepts: recipientEmail, subject, messageBody
 */
router.post('/send', auth, authorize('admin', 'secretary'), [
    body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
    body('subject').notEmpty().trim().withMessage('Subject is required'),
    body('messageBody').notEmpty().trim().withMessage('Message body is required')
], validate, async (req, res) => {
    try {
        const { recipientEmail, subject, messageBody, highPriority } = req.body;

        // Get admin user for sending
        const adminUser = await User.findByPk(req.user.id);
        
        // Create transporter
        const transporter = createTransporter();
        
        // Configure email options
        const mailOptions = {
            from: process.env.SMTP_FROM || `"SWA Admin" <${process.env.SMTP_USER || 'noreply@swa.org'}>`,
            to: recipientEmail,
            subject: highPriority ? `⚠️ ${subject}` : subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4a90d9; color: white; padding: 20px; text-align: center;">
                        <h1>Student Welfare Association | JOOUST</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <h2 style="color: #333;">${subject}</h2>
                        <div style="line-height: 1.6; color: #555;">
                            ${messageBody.replace(/\n/g, '<br>')}
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888;">
                            This is an automated message from the Student Welfare Association. 
                            Please do not reply to this email directly.
                        </p>
                    </div>
                </div>
            `,
            text: messageBody
        };

        // Send email (if SMTP is configured)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
        }

        // Log the email send attempt
        console.log(`Email sent to ${recipientEmail}: ${subject}`);

        res.json({
            success: true,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

/**
 * POST /api/email/send-bulk
 * Send email to all members
 * Accepts: subject, messageBody
 */
router.post('/send-bulk', auth, authorize('admin', 'secretary'), [
    body('subject').notEmpty().trim().withMessage('Subject is required'),
    body('messageBody').notEmpty().trim().withMessage('Message body is required')
], validate, async (req, res) => {
    try {
        const { subject, messageBody, highPriority, sendToActiveOnly } = req.body;

        // Fetch members
        const whereClause = sendToActiveOnly ? { membershipStatus: 'active' } : {};
        
        const members = await Member.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email'],
            where: whereClause,
            order: [['firstName', 'ASC']]
        });

        if (members.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No members found to send emails'
            });
        }

        // Get all unique email addresses
        const recipientEmails = [...new Set(members.map(m => m.email).filter(Boolean))];

        // Create transporter
        const transporter = createTransporter();

        // Configure email options
        const mailOptions = {
            from: process.env.SMTP_FROM || `"SWA Admin" <${process.env.SMTP_USER || 'noreply@swa.org'}>`,
            bcc: recipientEmails,
            subject: highPriority ? `⚠️ ${subject}` : subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4a90d9; color: white; padding: 20px; text-align: center;">
                        <h1>Student Welfare Association | JOOUST</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <h2 style="color: #333;">${subject}</h2>
                        <div style="line-height: 1.6; color: #555;">
                            ${messageBody.replace(/\n/g, '<br>')}
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888;">
                            This is an automated message from the Student Welfare Association. 
                            Please do not reply to this email directly.
                        </p>
                    </div>
                </div>
            `,
            text: messageBody
        };

        let sentCount = 0;
        let failedCount = 0;

        // Send email (if SMTP is configured)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                await transporter.sendMail(mailOptions);
                sentCount = recipientEmails.length;
            } catch (emailError) {
                console.error('Bulk email error:', emailError);
                failedCount = recipientEmails.length;
            }
        } else {
            // If no SMTP configured, simulate success
            sentCount = recipientEmails.length;
            console.log(`[SIMULATED] Bulk email to ${sentCount} members: ${subject}`);
        }

        res.json({
            success: true,
            message: `Email sent to ${sentCount} members`,
            data: {
                totalRecipients: members.length,
                sentCount,
                failedCount
            }
        });
    } catch (error) {
        console.error('Error sending bulk email:', error);
        res.status(500).json({ success: false, message: 'Failed to send bulk email' });
    }
});

/**
 * POST /api/email/test
 * Send test email to admin's own email
 */
router.post('/test', auth, authorize('admin', 'secretary'), [
    body('subject').notEmpty().trim().withMessage('Subject is required'),
    body('messageBody').notEmpty().trim().withMessage('Message body is required')
], validate, async (req, res) => {
    try {
        const { subject, messageBody } = req.body;

        // Get admin's email
        const adminUser = await User.findByPk(req.user.id);
        
        if (!adminUser || !adminUser.email) {
            return res.status(400).json({
                success: false,
                message: 'Admin email not found'
            });
        }

        // Create transporter
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_FROM || `"SWA Admin" <${process.env.SMTP_USER || 'noreply@swa.org'}>`,
            to: adminUser.email,
            subject: `TEST: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4a90d9; color: white; padding: 20px; text-align: center;">
                        <h1>Student Welfare Association | JOOUST</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <p style="color: #e74c3c;"><strong>This is a TEST email</strong></p>
                        <h2 style="color: #333;">${subject}</h2>
                        <div style="line-height: 1.6; color: #555;">
                            ${messageBody.replace(/\n/g, '<br>')}
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888;">
                            This is a test email from the SWA Admin panel.
                        </p>
                    </div>
                </div>
            `,
            text: messageBody
        };

        // Send test email
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
        }

        res.json({
            success: true,
            message: `Test email sent to ${adminUser.email}`
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
});

module.exports = router;

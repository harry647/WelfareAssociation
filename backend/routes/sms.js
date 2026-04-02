/**
 * SMS Routes
 * Handles SMS sending operations for admin
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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

// Send SMS via external service configured in .env
async function sendSMS(to, message, senderId = 'SWA') {
    // Check if SMS provider is configured
    const provider = process.env.SMS_PROVIDER || 'simulation';
    
    console.log(`[SMS] Provider: ${provider}, To: ${to}`);
    
    switch (provider) {
        case 'twilio':
            // Twilio SMS
            const twilio = require('twilio');
            const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            return await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            
        case 'africastalking':
            // Africa's Talking SMS
            const AfricasTalking = require('africastalking');
            const atClient = AfricasTalking({
                apiKey: process.env.AFRICASTALKING_API_KEY,
                username: process.env.AFRICASTALKING_USERNAME
            });
            const result = await atClient.SMS.send({
                to: to,
                message: message,
                from: senderId
            });
            return result;
            
        case 'simulation':
        default:
            // Simulate sending (for testing)
            console.log(`[SMS] Sending to ${to}: ${message.substring(0, 50)}...`);
            return { success: true, to, messageId: `sim_${Date.now()}` };
    }
}

/**
 * GET /api/sms/members
 * Get all registered members with phone numbers for SMS dropdown
 * Returns JSON array with id, name, phone fields
 */
router.get('/members', auth, authorize('admin', 'secretary'), async (req, res) => {
    try {
        const members = await Member.findAll({
            attributes: ['id', 'firstName', 'lastName', 'phone', 'membershipStatus'],
            where: {
                membershipStatus: 'active'
            },
            order: [['firstName', 'ASC'], ['lastName', 'ASC']]
        });

        const memberList = members
            .filter(m => m.phone) // Only include members with phone numbers
            .map(m => ({
                id: m.id,
                name: `${m.firstName} ${m.lastName}`,
                phone: m.phone
            }));

        res.json({
            success: true,
            data: memberList
        });
    } catch (error) {
        console.error('Error fetching members for SMS:', error);
        res.status(500).json({ success: false, message: 'Error fetching members' });
    }
});

/**
 * POST /api/sms/send
 * Send SMS to a single member
 * Accepts: recipientPhone, message
 */
router.post('/send', auth, authorize('admin', 'secretary'), [
    body('recipientPhone').notEmpty().withMessage('Phone number is required'),
    body('message').notEmpty().trim().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const { recipientPhone, message, senderId } = req.body;

        // Format phone number
        let phoneNumber = recipientPhone.replace(/[\s-]/g, '');
        if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+254' + phoneNumber.replace(/^254/, '');
        }

        // Send SMS
        const result = await sendSMS(phoneNumber, message, senderId);

        res.json({
            success: true,
            message: 'SMS sent successfully',
            data: {
                messageId: result.messageId,
                recipient: phoneNumber
            }
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ success: false, message: 'Failed to send SMS' });
    }
});

/**
 * POST /api/sms/send-bulk
 * Send SMS to all members
 * Accepts: message
 */
router.post('/send-bulk', auth, authorize('admin', 'secretary'), [
    body('message').notEmpty().trim().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const { message, senderId, sendToActiveOnly } = req.body;

        // Fetch members
        const whereClause = sendToActiveOnly ? { membershipStatus: 'active', phone: { [require('sequelize').Op.ne]: null } } : { phone: { [require('sequelize').Op.ne]: null } };
        
        const members = await Member.findAll({
            attributes: ['id', 'firstName', 'lastName', 'phone'],
            where: whereClause,
            order: [['firstName', 'ASC']]
        });

        if (members.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No members found with phone numbers'
            });
        }

        let sentCount = 0;
        let failedCount = 0;
        const results = [];

        // Send SMS to each member
        for (const member of members) {
            try {
                let phoneNumber = member.phone.replace(/[\s-]/g, '');
                if (!phoneNumber.startsWith('+')) {
                    phoneNumber = '+254' + phoneNumber.replace(/^254/, '');
                }

                const result = await sendSMS(phoneNumber, message, senderId);
                results.push({ memberId: member.id, phone: phoneNumber, status: 'sent', messageId: result.messageId });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send SMS to ${member.phone}:`, err);
                results.push({ memberId: member.id, phone: member.phone, status: 'failed', error: err.message });
                failedCount++;
            }
        }

        res.json({
            success: true,
            message: `SMS sent to ${sentCount} members`,
            data: {
                totalRecipients: members.length,
                sentCount,
                failedCount,
                results
            }
        });
    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        res.status(500).json({ success: false, message: 'Failed to send bulk SMS' });
    }
});

/**
 * POST /api/sms/test
 * Send test SMS to admin's phone
 */
router.post('/test', auth, authorize('admin', 'secretary'), [
    body('message').notEmpty().trim().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const { message } = req.body;

        // Get admin's phone from user data
        const adminUser = await User.findByPk(req.user.id);
        
        // Try to get member's phone
        let adminPhone = null;
        if (adminUser.memberId) {
            const member = await Member.findByPk(adminUser.memberId);
            if (member && member.phone) {
                adminPhone = member.phone;
            }
        }
        
        // Use phone from request or admin's phone
        const phoneNumber = req.body.phone || adminPhone;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'No phone number available for test SMS'
            });
        }

        // Format phone number
        let formattedPhone = phoneNumber.replace(/[\s-]/g, '');
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+254' + formattedPhone.replace(/^254/, '');
        }

        // Send test SMS
        const result = await sendSMS(formattedPhone, `[TEST] ${message}`);

        res.json({
            success: true,
            message: `Test SMS sent to ${formattedPhone}`,
            data: {
                messageId: result.messageId,
                recipient: formattedPhone
            }
        });
    } catch (error) {
        console.error('Error sending test SMS:', error);
        res.status(500).json({ success: false, message: 'Failed to send test SMS' });
    }
});

module.exports = router;

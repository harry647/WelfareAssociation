/**
 * WhatsApp Routes
 * Handles WhatsApp messaging operations for admin
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

// Send WhatsApp message via external service configured in .env
async function sendWhatsApp(to, message, mediaUrl = null) {
    // Check if WhatsApp provider is configured
    const provider = process.env.WHATSAPP_PROVIDER || 'simulation';
    
    console.log(`[WhatsApp] Provider: ${provider}, To: ${to}`);
    
    switch (provider) {
        case 'twilio':
            // Twilio WhatsApp
            const twilio = require('twilio');
            const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            return await twilioClient.messages.create({
                body: message,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${to}`,
                mediaUrl: mediaUrl
            });
            
        case 'meta':
            // Meta Cloud API (Facebook WhatsApp Business API)
            const axios = require('axios');
            const metaResponse = await axios.post(
                `https://graph.facebook.com/v17.0/${process.env.META_WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    text: { body: message },
                    ...(mediaUrl && { media: mediaUrl })
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return metaResponse.data;
            
        case 'infobip':
            // Infobip WhatsApp
            const infobipResponse = await fetch(`https://${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/template`, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.INFOBIP_WHATSAPP_NUMBER,
                    to: to,
                    content: {
                        type: 'text',
                        text: message
                    }
                })
            });
            return await infobipResponse.json();
            
        case 'simulation':
        default:
            // Simulate sending (for testing)
            console.log(`[WhatsApp] Sending to ${to}: ${message.substring(0, 50)}...`);
            return { success: true, to, messageId: `wa_sim_${Date.now()}` };
    }
}

/**
 * GET /api/whatsapp/members
 * Get all registered members with phone numbers for WhatsApp dropdown
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
        console.error('Error fetching members for WhatsApp:', error);
        res.status(500).json({ success: false, message: 'Error fetching members' });
    }
});

/**
 * POST /api/whatsapp/send
 * Send WhatsApp message to a single member
 * Accepts: recipientPhone, message
 */
router.post('/send', auth, authorize('admin', 'secretary'), [
    body('recipientPhone').notEmpty().withMessage('Phone number is required'),
    body('message').notEmpty().trim().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const { recipientPhone, message, mediaUrl } = req.body;

        // Format phone number (WhatsApp requires format: +254712345678)
        let phoneNumber = recipientPhone.replace(/[\s-]/g, '');
        if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+254' + phoneNumber.replace(/^254/, '');
        }

        // Send WhatsApp message
        const result = await sendWhatsApp(phoneNumber, message, mediaUrl);

        res.json({
            success: true,
            message: 'WhatsApp message sent successfully',
            data: {
                messageId: result.messageId,
                recipient: phoneNumber
            }
        });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({ success: false, message: 'Failed to send WhatsApp message' });
    }
});

/**
 * POST /api/whatsapp/send-bulk
 * Send WhatsApp message to all members
 * Accepts: message
 */
router.post('/send-bulk', auth, authorize('admin', 'secretary'), [
    body('message').notEmpty().trim().withMessage('Message is required')
], validate, async (req, res) => {
    try {
        const { message, mediaUrl, sendToActiveOnly } = req.body;

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

        // Send WhatsApp message to each member
        for (const member of members) {
            try {
                let phoneNumber = member.phone.replace(/[\s-]/g, '');
                if (!phoneNumber.startsWith('+')) {
                    phoneNumber = '+254' + phoneNumber.replace(/^254/, '');
                }

                const result = await sendWhatsApp(phoneNumber, message, mediaUrl);
                results.push({ memberId: member.id, phone: phoneNumber, status: 'sent', messageId: result.messageId });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send WhatsApp to ${member.phone}:`, err);
                results.push({ memberId: member.id, phone: member.phone, status: 'failed', error: err.message });
                failedCount++;
            }
        }

        res.json({
            success: true,
            message: `WhatsApp message sent to ${sentCount} members`,
            data: {
                totalRecipients: members.length,
                sentCount,
                failedCount,
                results
            }
        });
    } catch (error) {
        console.error('Error sending bulk WhatsApp:', error);
        res.status(500).json({ success: false, message: 'Failed to send bulk WhatsApp message' });
    }
});

/**
 * POST /api/whatsapp/test
 * Send test WhatsApp message to admin's phone
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
                message: 'No phone number available for test WhatsApp message'
            });
        }

        // Format phone number
        let formattedPhone = phoneNumber.replace(/[\s-]/g, '');
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+254' + formattedPhone.replace(/^254/, '');
        }

        // Send test WhatsApp message
        const result = await sendWhatsApp(formattedPhone, `[TEST] ${message}`);

        res.json({
            success: true,
            message: `Test WhatsApp message sent to ${formattedPhone}`,
            data: {
                messageId: result.messageId,
                recipient: formattedPhone
            }
        });
    } catch (error) {
        console.error('Error sending test WhatsApp:', error);
        res.status(500).json({ success: false, message: 'Failed to send test WhatsApp message' });
    }
});

module.exports = router;

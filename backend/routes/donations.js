/**
 * Donation Routes
 * Handles all donation types: one-time, monthly, scholarship, corporate, in-kind
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Donation = require('../models/Donation');
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

// Phone validation regex
const phoneRegex = /^254[0-9]{9}$/;

/**
 * POST /api/donations/one-time
 * Submit one-time donation
 */
router.post('/one-time', [
    body('donorName').notEmpty().withMessage('Donor name is required').isLength({ min: 2, max: 200 }),
    body('donorEmail').isEmail().withMessage('Valid email is required'),
    body('donorPhone').optional().matches(phoneRegex).withMessage('Phone must be in format: 254XXXXXXXXX'),
    body('amount').isNumeric().isFloat({ min: 100 }).withMessage('Amount must be at least Ksh 100'),
    body('paymentMethod').isIn(['mpesa', 'bank', 'cash']).withMessage('Valid payment method is required'),
    body('transactionId').optional().isLength({ max: 100 }),
    body('message').optional().isLength({ max: 1000 }),
    body('anonymous').optional().isBoolean(),
    validate
], async (req, res) => {
    try {
        const {
            donorName,
            donorEmail,
            donorPhone,
            amount,
            paymentMethod,
            transactionId,
            message,
            anonymous
        } = req.body;

        const donation = await Donation.create({
            type: 'one-time',
            donorName,
            donorEmail,
            donorPhone,
            amount,
            paymentMethod,
            transactionId,
            message,
            anonymous: anonymous || false,
            status: paymentMethod === 'cash' ? 'completed' : 'pending',
            paymentDate: paymentMethod === 'cash' ? new Date() : null
        });

        res.status(201).json({
            success: true,
            message: 'One-time donation submitted successfully',
            data: {
                id: donation.id,
                type: donation.type,
                amount: donation.amount,
                status: donation.status,
                donorName: donation.anonymous ? 'Anonymous' : donation.donorName,
                createdAt: donation.createdAt
            }
        });
    } catch (error) {
        console.error('One-time donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting donation'
        });
    }
});

/**
 * POST /api/donations/monthly
 * Submit monthly donation setup
 */
router.post('/monthly', [
    body('donorName').notEmpty().withMessage('Donor name is required').isLength({ min: 2, max: 200 }),
    body('donorEmail').isEmail().withMessage('Valid email is required'),
    body('donorPhone').matches(phoneRegex).withMessage('Phone must be in format: 254XXXXXXXXX'),
    body('amount').isNumeric().isFloat({ min: 100 }).withMessage('Amount must be at least Ksh 100'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('duration').isIn(['ongoing', '6months', '12months']).withMessage('Valid duration is required'),
    body('message').optional().isLength({ max: 1000 }),
    validate
], async (req, res) => {
    try {
        const {
            donorName,
            donorEmail,
            donorPhone,
            amount,
            startDate,
            duration,
            message
        } = req.body;

        const donation = await Donation.create({
            type: 'monthly',
            donorName,
            donorEmail,
            donorPhone,
            amount,
            monthlyStartDate: startDate,
            monthlyDuration: duration,
            message,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Monthly donation setup submitted successfully',
            data: {
                id: donation.id,
                type: donation.type,
                amount: donation.amount,
                monthlyStartDate: donation.monthlyStartDate,
                monthlyDuration: donation.monthlyDuration,
                status: donation.status,
                createdAt: donation.createdAt
            }
        });
    } catch (error) {
        console.error('Monthly donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting up monthly donation'
        });
    }
});

/**
 * POST /api/donations/scholarship
 * Submit scholarship sponsorship inquiry
 */
router.post('/scholarship', [
    body('donorName').notEmpty().withMessage('Donor name is required').isLength({ min: 2, max: 200 }),
    body('donorEmail').isEmail().withMessage('Valid email is required'),
    body('donorPhone').optional().matches(phoneRegex).withMessage('Phone must be in format: 254XXXXXXXXX'),
    body('sponsorshipType').isIn(['full', 'semester', 'partial', 'custom']).withMessage('Valid sponsorship type is required'),
    body('amount').optional().isNumeric().isFloat({ min: 1000 }).withMessage('Custom amount must be at least Ksh 1000'),
    body('duration').isIn(['one-time', 'monthly', 'quarterly']).withMessage('Valid payment duration is required'),
    body('focusArea').optional().isIn(['any', 'science', 'business', 'arts', 'health']),
    body('message').optional().isLength({ max: 1000 }),
    body('anonymous').optional().isBoolean(),
    validate
], async (req, res) => {
    try {
        const {
            donorName,
            donorEmail,
            donorPhone,
            sponsorshipType,
            amount,
            duration,
            focusArea,
            message,
            anonymous
        } = req.body;

        // Calculate amount based on sponsorship type if not custom
        let finalAmount = amount;
        if (sponsorshipType !== 'custom' && !amount) {
            switch (sponsorshipType) {
                case 'full':
                    finalAmount = 50000;
                    break;
                case 'semester':
                    finalAmount = 25000;
                    break;
                case 'partial':
                    finalAmount = 10000;
                    break;
            }
        }

        const donation = await Donation.create({
            type: 'scholarship',
            donorName,
            donorEmail,
            donorPhone,
            amount: finalAmount,
            sponsorshipType,
            sponsorshipDuration: duration,
            scholarshipFocus: focusArea || 'any',
            message,
            anonymous: anonymous || false,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Scholarship sponsorship inquiry submitted successfully',
            data: {
                id: donation.id,
                type: donation.type,
                amount: donation.amount,
                sponsorshipType: donation.sponsorshipType,
                status: donation.status,
                createdAt: donation.createdAt
            }
        });
    } catch (error) {
        console.error('Scholarship donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting scholarship inquiry'
        });
    }
});

/**
 * POST /api/donations/corporate
 * Submit corporate partnership inquiry
 */
router.post('/corporate', [
    body('companyName').notEmpty().withMessage('Company name is required').isLength({ min: 2, max: 200 }),
    body('contactPerson').notEmpty().withMessage('Contact person is required').isLength({ min: 2, max: 200 }),
    body('companyEmail').isEmail().withMessage('Valid company email is required'),
    body('companyPhone').optional().matches(phoneRegex).withMessage('Phone must be in format: 254XXXXXXXXX'),
    body('partnershipType').isIn(['sponsor', 'scholarship', 'mentorship', 'infrastructure', 'custom']).withMessage('Valid partnership type is required'),
    body('proposedContribution').optional().isLength({ max: 2000 }),
    body('message').optional().isLength({ max: 2000 }),
    validate
], async (req, res) => {
    try {
        const {
            companyName,
            contactPerson,
            companyEmail,
            companyPhone,
            partnershipType,
            proposedContribution,
            message
        } = req.body;

        const donation = await Donation.create({
            type: 'corporate',
            donorName: contactPerson,
            donorEmail: companyEmail,
            donorPhone: companyPhone,
            companyName,
            contactPerson,
            partnershipType,
            proposedContribution,
            message,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Corporate partnership inquiry submitted successfully',
            data: {
                id: donation.id,
                type: donation.type,
                companyName: donation.companyName,
                partnershipType: donation.partnershipType,
                status: donation.status,
                createdAt: donation.createdAt
            }
        });
    } catch (error) {
        console.error('Corporate donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting partnership inquiry'
        });
    }
});

/**
 * POST /api/donations/inkind
 * Submit in-kind donation
 */
router.post('/inkind', [
    body('donorName').notEmpty().withMessage('Donor name is required').isLength({ min: 2, max: 200 }),
    body('donorEmail').isEmail().withMessage('Valid email is required'),
    body('donorPhone').optional().matches(phoneRegex).withMessage('Phone must be in format: 254XXXXXXXXX'),
    body('category').isIn(['books', 'laptops', 'food', 'clothing', 'stationery', 'other']).withMessage('Valid category is required'),
    body('itemDescription').notEmpty().withMessage('Item description is required').isLength({ min: 10, max: 1000 }),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('condition').optional().isIn(['new', 'like-new', 'good', 'fair']).withMessage('Valid condition is required'),
    body('pickupOption').optional().isIn(['dropoff', 'pickup']).withMessage('Valid pickup option is required'),
    body('message').optional().isLength({ max: 1000 }),
    validate
], async (req, res) => {
    try {
        const {
            donorName,
            donorEmail,
            donorPhone,
            category,
            itemDescription,
            quantity,
            condition,
            pickupOption,
            message
        } = req.body;

        const donation = await Donation.create({
            type: 'inkind',
            donorName,
            donorEmail,
            donorPhone,
            donationCategory: category,
            itemDescription,
            itemQuantity: quantity || 1,
            itemCondition: condition || 'good',
            pickupOption: pickupOption || 'dropoff',
            message,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'In-kind donation submitted successfully',
            data: {
                id: donation.id,
                type: donation.type,
                donationCategory: donation.donationCategory,
                itemDescription: donation.itemDescription,
                itemQuantity: donation.itemQuantity,
                status: donation.status,
                createdAt: donation.createdAt
            }
        });
    } catch (error) {
        console.error('In-kind donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting in-kind donation'
        });
    }
});

/**
 * GET /api/donations
 * Get all donations (admin only)
 */
router.get('/', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10 } = req.query;
        
        const where = {};
        if (type) where.type = type;
        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { count, rows: donations } = await Donation.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: donations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donations'
        });
    }
});

/**
 * GET /api/donations/stats
 * Get donation statistics (admin only)
 */
router.get('/stats', auth, authorize('admin', 'treasurer'), async (req, res) => {
    try {
        const stats = await Donation.getStats();
        
        // Get total amount
        const totalAmount = await Donation.sum('amount', {
            where: { 
                status: 'completed',
                amount: { [Op.not]: null }
            }
        });

        res.json({
            success: true,
            data: {
                stats,
                totalAmount: totalAmount || 0
            }
        });
    } catch (error) {
        console.error('Error fetching donation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

/**
 * PUT /api/donations/:id
 * Update donation status (admin only)
 */
router.put('/:id', auth, authorize('admin', 'treasurer'), [
    body('status').isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Valid status is required'),
    body('notes').optional().isLength({ max: 1000 }),
    body('receiptIssued').optional().isBoolean(),
    validate
], async (req, res) => {
    try {
        const { status, notes, receiptIssued } = req.body;

        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        const updateData = { status };
        if (notes) updateData.notes = notes;
        if (receiptIssued !== undefined) updateData.receiptIssued = receiptIssued;
        
        // Set payment date when status changes to completed
        if (status === 'completed' && !donation.paymentDate) {
            updateData.paymentDate = new Date();
        }

        await donation.update(updateData);

        res.json({
            success: true,
            message: 'Donation updated successfully',
            data: donation
        });
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating donation'
        });
    }
});

/**
 * DELETE /api/donations/:id
 * Delete donation (admin only)
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const donation = await Donation.findByPk(req.params.id);
        
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        await donation.destroy();

        res.json({
            success: true,
            message: 'Donation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting donation'
        });
    }
});

module.exports = router;

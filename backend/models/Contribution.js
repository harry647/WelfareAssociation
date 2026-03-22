/**
 * Contribution Model
 * Handles member contributions/dues
 */

const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    contributionNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Contribution details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['monthly', 'special', 'registration', 'voluntary', 'fine', 'other'],
        default: 'monthly'
    },
    period: {
        month: Number,
        year: Number
    },
    // Payment details
    paymentMethod: {
        type: String,
        enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'],
        default: 'cash'
    },
    paymentReference: String,
    paymentDate: {
        type: Date,
        default: Date.now
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // Notes
    description: String,
    // Recorded by
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Attachments
    receipt: {
        type: String
    }
}, {
    timestamps: true
});

// Generate contribution number before saving
contributionSchema.pre('save', async function(next) {
    if (!this.contributionNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await mongoose.model('Contribution').countDocuments();
        this.contributionNumber = `CON/${year}${month}/${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Index for efficient queries
contributionSchema.index({ member: 1, createdAt: -1 });
contributionSchema.index({ period: 1 });

module.exports = mongoose.model('Contribution', contributionSchema);

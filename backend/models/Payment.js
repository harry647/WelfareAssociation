/**
 * Payment Model
 * Handles all payment transactions
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    paymentNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Payment type
    type: {
        type: String,
        enum: ['loan_repayment', 'contribution', 'savings', 'fine', 'donation', 'other'],
        required: true
    },
    // Related entity (loan, contribution, etc.)
    relatedTo: {
        model: {
            type: String,
            enum: ['Loan', 'Contribution', 'Savings', 'Fine', 'Bereavement']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    // Amount
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Payment method
    method: {
        type: String,
        enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'],
        default: 'cash'
    },
    // M-Pesa specific
    mpesa: {
        checkoutRequestId: String,
        merchantRequestId: String,
        transactionId: String,
        phoneNumber: String
    },
    // Payment reference
    reference: String,
    transactionId: String,
    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // Dates
    paymentDate: {
        type: Date,
        default: Date.now
    },
    processedDate: Date,
    // Description
    description: String,
    // Receipt
    receipt: {
        type: String
    },
    // Processed by
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate payment number before saving
paymentSchema.pre('save', async function(next) {
    if (!this.paymentNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const count = await mongoose.model('Payment').countDocuments();
        this.paymentNumber = `PAY/${year}/${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);

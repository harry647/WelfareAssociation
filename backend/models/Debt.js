/**
 * Debt Model
 * Tracks member debts and outstanding payments
 */

const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    debtNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Debt type
    type: {
        type: String,
        enum: ['loan_overdue', 'contribution_arrears', 'fine_unpaid', 'other'],
        default: 'other'
    },
    // Amount
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Due date
    dueDate: {
        type: Date,
        required: true
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'overdue', 'paid', 'waived'],
        default: 'pending'
    },
    // Related entity (loan, fine, etc.)
    relatedTo: {
        model: String,
        id: mongoose.Schema.Types.ObjectId
    },
    // Payment history
    payments: [{
        date: Date,
        amount: Number,
        method: String,
        reference: String
    }],
    paidAmount: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    // Reminders sent
    remindersSent: [{
        date: Date,
        method: String,
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Notes
    notes: String,
    // Waived
    waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waiverReason: String,
    waivedAt: Date
}, {
    timestamps: true
});

// Generate debt number before saving
debtSchema.pre('save', async function(next) {
    if (!this.debtNumber) {
        const count = await mongoose.model('Debt').countDocuments();
        this.debtNumber = `DEBT${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Calculate days overdue
debtSchema.virtual('daysOverdue').get(function() {
    if (this.status === 'paid' || this.status === 'waived') return 0;
    const now = new Date();
    const due = new Date(this.dueDate);
    if (now > due) {
        return Math.floor((now - due) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Debt', debtSchema);

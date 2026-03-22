/**
 * Fine Model
 * Tracks fines issued to members
 */

const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    fineNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Fine type reference
    fineType: {
        name: String,
        category: String,
        code: String
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
        enum: ['unpaid', 'paid', 'waived'],
        default: 'unpaid'
    },
    // Description
    description: String,
    // Payment
    paidDate: Date,
    paymentMethod: String,
    paymentReference: String,
    // Reminders
    remindersSent: [{
        date: Date,
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Issued by
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

// Generate fine number before saving
fineSchema.pre('save', async function(next) {
    if (!this.fineNumber) {
        const count = await mongoose.model('Fine').countDocuments();
        this.fineNumber = `FINE${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Virtual for days overdue
fineSchema.virtual('daysOverdue').get(function() {
    if (this.status !== 'unpaid') return 0;
    const now = new Date();
    const due = new Date(this.dueDate);
    if (now > due) {
        return Math.floor((now - due) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

fineSchema.set('toJSON', { virtuals: true });
fineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Fine', fineSchema);

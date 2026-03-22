/**
 * Savings Model
 * Tracks member savings goals and withdrawals
 */

const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    goalNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Goal details
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    // Status
    status: {
        type: String,
        enum: ['active', 'completed', 'withdrawn', 'cancelled'],
        default: 'active'
    },
    // Target date
    targetDate: Date,
    // Transactions
    transactions: [{
        type: {
            type: String,
            enum: ['deposit', 'withdrawal'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        method: String,
        reference: String,
        note: String,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Completion
    completedDate: Date,
    // Notes
    notes: String
}, {
    timestamps: true
});

// Generate goal number before saving
savingsSchema.pre('save', async function(next) {
    if (!this.goalNumber) {
        const count = await mongoose.model('Savings').countDocuments();
        this.goalNumber = `SVG${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Calculate progress percentage
savingsSchema.virtual('progress').get(function() {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

savingsSchema.set('toJSON', { virtuals: true });
savingsSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Savings', savingsSchema);

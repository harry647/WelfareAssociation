/**
 * Newsletter Model
 * Handles newsletter subscriptions
 */

const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    name: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: Date,
    ipAddress: String,
    source: {
        type: String,
        enum: ['website', 'registration', 'event', 'manual'],
        default: 'website'
    }
}, {
    timestamps: true
});

// Index
newsletterSchema.index({ email: 1 });

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;

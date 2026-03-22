/**
 * Policy Model
 * Handles organization policies and guidelines
 */

const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['membership', 'financial', 'loans', 'conduct', 'events', 'hr', 'general', 'other'],
        default: 'general'
    },
    version: {
        type: String,
        default: '1.0'
    },
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'active', 'archived'],
        default: 'draft'
    },
    effectiveDate: {
        type: Date,
        default: null
    },
    expiryDate: {
        type: Date,
        default: null
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    requiresAcknowledgment: {
        type: Boolean,
        default: false
    },
    acknowledgments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        acknowledgedAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        name: String,
        url: String,
        mimeType: String,
        size: Number
    }],
    relatedPolicies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Policy'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
policySchema.index({ category: 1, status: 1 });
policySchema.index({ title: 'text', content: 'text' });
policySchema.index({ createdAt: -1 });

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;

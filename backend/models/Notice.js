/**
 * Notice Model
 * Handles notices and announcements
 */

const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    // Notice type
    type: {
        type: String,
        enum: ['general', 'important', 'urgent', 'event', 'meeting', 'reminder'],
        default: 'general'
    },
    // Priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    // Target audience
    audience: {
        type: String,
        enum: ['all', 'members', 'executives', 'students', 'staff'],
        default: 'all'
    },
    // Status
    isPublished: {
        type: Boolean,
        default: false
    },
    publishDate: Date,
    expiryDate: Date,
    // Attachments
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    // Author
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // View count
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient queries
noticeSchema.index({ isPublished: 1, publishDate: -1 });

module.exports = mongoose.model('Notice', noticeSchema);

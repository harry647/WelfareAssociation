/**
 * Announcement Model
 * Handles announcement/notification data
 */

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['general', 'urgent', 'reminder', 'event', 'news'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'members', 'officers', 'executives', 'specific'],
        default: 'all'
    },
    specificMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }],
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    recipients: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        viewedAt: Date,
        viewed: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isActive: 1, expiresAt: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;

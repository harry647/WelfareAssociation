/**
 * Volunteer Model
 * Handles volunteer applications and management
 */

const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    area: {
        type: String,
        enum: ['events', 'education', 'community', 'fundraising', 'administration', 'other'],
        required: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    availability: {
        weekdays: { type: Boolean, default: false },
        weekends: { type: Boolean, default: false },
        evenings: { type: Boolean, default: false }
    },
    experience: {
        type: String,
        default: ''
    },
    motivation: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: {
        type: String,
        default: null
    },
    hoursContributed: {
        type: Number,
        default: 0
    },
    activities: [{
        date: Date,
        hours: Number,
        description: String,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    notes: [{
        content: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
volunteerSchema.index({ member: 1, status: 1 });
volunteerSchema.index({ area: 1, status: 1 });
volunteerSchema.index({ createdAt: -1 });

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = Volunteer;

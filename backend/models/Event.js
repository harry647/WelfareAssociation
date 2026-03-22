/**
 * Event Model
 * Handles events and activities
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    // Event details
    eventDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    location: {
        venue: String,
        address: String,
        virtual: {
            isVirtual: Boolean,
            meetingLink: String
        }
    },
    // Event type
    type: {
        type: String,
        enum: ['meeting', 'workshop', 'seminar', 'social', 'fundraiser', 'sports', 'other'],
        default: 'other'
    },
    // Registration
    requiresRegistration: {
        type: Boolean,
        default: false
    },
    maxAttendees: Number,
    registeredAttendees: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        registeredAt: Date,
        status: {
            type: String,
            enum: ['registered', 'attended', 'cancelled'],
            default: 'registered'
        }
    }],
    // Status
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },
    // Image
    image: String,
    // Organizer
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Attachments
    attachments: [{
        name: String,
        url: String,
        type: String
    }]
}, {
    timestamps: true
});

// Index for efficient queries
eventSchema.index({ eventDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);

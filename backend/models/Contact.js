/**
 * Contact Model
 * Handles contact inquiries and messages
 */

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'membership', 'contribution', 'loan', 'technical', 'feedback', 'complaint', 'other'],
        default: 'general'
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'resolved', 'closed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    repliedAt: Date,
    ipAddress: String,
    userAgent: String,
    attachments: [{
        name: String,
        url: String,
        mimeType: String
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    readBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
contactSchema.index({ status: 1, priority: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;

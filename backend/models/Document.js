/**
 * Document Model
 * Handles document management and storage
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['policy', 'report', 'meeting', 'financial', 'membership', 'other'],
        default: 'other'
    },
    subcategory: {
        type: String,
        default: ''
    },
    visibility: {
        type: String,
        enum: ['public', 'members', 'officers', 'executives', 'admin'],
        default: 'members'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    },
    tags: [{
        type: String,
        trim: true
    }],
    version: {
        type: Number,
        default: 1
    },
    previousVersions: [{
        version: Number,
        fileName: String,
        path: String,
        uploadedAt: Date,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    sharedWith: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        permission: {
            type: String,
            enum: ['view', 'download', 'edit'],
            default: 'view'
        }
    }],
    downloadCount: {
        type: Number,
        default: 0
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expiryDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
documentSchema.index({ name: 'text', description: 'text', tags: 'text' });
documentSchema.index({ category: 1, visibility: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

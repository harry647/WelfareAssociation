/**
 * Gallery Model
 * Handles gallery images and media
 */

const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['image', 'video', 'album'],
        default: 'image'
    },
    category: {
        type: String,
        enum: ['events', 'meetings', 'community', 'projects', 'other'],
        default: 'other'
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        thumbnail: String,
        caption: String,
        altText: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    coverImage: {
        type: String,
        default: null
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    tags: [{
        type: String,
        trim: true
    }],
    visibility: {
        type: String,
        enum: ['public', 'members', 'officers', 'admin'],
        default: 'public'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
gallerySchema.index({ category: 1, isActive: 1 });
gallerySchema.index({ tags: 1 });
gallerySchema.index({ createdAt: -1 });

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;

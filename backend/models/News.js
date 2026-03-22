/**
 * News Model
 * Handles news articles and updates
 */

const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: String,
    // Category
    category: {
        type: String,
        enum: ['announcement', 'update', 'success_story', 'press_release', 'other'],
        default: 'announcement'
    },
    // Status
    isPublished: {
        type: Boolean,
        default: false
    },
    publishDate: Date,
    // Featured image
    image: String,
    // Author
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Tags
    tags: [String],
    // View count
    views: {
        type: Number,
        default: 0
    },
    // Featured
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
newsSchema.index({ isPublished: 1, publishDate: -1 });

module.exports = mongoose.model('News', newsSchema);

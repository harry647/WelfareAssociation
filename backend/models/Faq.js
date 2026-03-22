/**
 * FAQ Model
 * Handles Frequently Asked Questions
 */

const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['membership', 'contributions', 'loans', 'events', 'general', 'technical', 'other'],
        default: 'general'
    },
    tags: [{
        type: String,
        trim: true
    }],
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    helpful: {
        type: Number,
        default: 0
    },
    notHelpful: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;

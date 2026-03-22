/**
 * Report Model
 * Handles report generation and management
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['contribution', 'loan', 'membership', 'financial', 'attendance', 'bereavement', 'summary', 'custom'],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parameters: {
        startDate: Date,
        endDate: Date,
        memberId: mongoose.Schema.Types.ObjectId,
        department: String,
        status: String,
        category: String,
        includeCharts: {
            type: Boolean,
            default: false
        }
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'json'],
        default: 'pdf'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    scheduled: {
        isScheduled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'],
            default: null
        },
        nextRun: Date,
        lastRun: Date,
        recipients: [{
            email: String,
            name: String
        }]
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateName: {
        type: String,
        default: null
    },
    viewCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
reportSchema.index({ type: 1, generatedBy: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;

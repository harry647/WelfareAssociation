/**
 * Bereavement Model
 * Handles bereavement support and contributions
 */

const mongoose = require('mongoose');

const bereavementSchema = new mongoose.Schema({
    // Deceased information
    deceased: {
        name: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            required: true
        },
        dateOfDeath: {
            type: Date,
            required: true
        },
        dateOfBurial: Date,
        cause: String
    },
    // Member (the one who lost a loved one)
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'active', 'closed'],
        default: 'pending'
    },
    // Contributions from other members
    contributions: [{
        contributor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        amount: Number,
        date: {
            type: Date,
            default: Date.now
        },
        paymentMethod: String,
        reference: String,
        message: String
    }],
    totalContributions: {
        type: Number,
        default: 0
    },
    // Messages of condolence
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        message: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    // Notes
    notes: String,
    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Update total contributions after save
bereavementSchema.methods.updateTotalContributions = async function() {
    const total = this.contributions.reduce((sum, c) => sum + c.amount, 0);
    this.totalContributions = total;
    await this.save();
};

module.exports = mongoose.model('Bereavement', bereavementSchema);

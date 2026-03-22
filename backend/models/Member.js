/**
 * Member Model
 * Handles member profile and membership details
 */

const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    memberNumber: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    // Education/Institution details
    institution: {
        name: String,
        department: String,
        studentId: String,
        admissionYear: Number,
        graduationYear: Number
    },
    // Employment details (for working members)
    employment: {
        company: String,
        position: String,
        department: String
    },
    // Membership details
    membershipType: {
        type: String,
        enum: ['student', 'alumni', 'staff', 'honorary'],
        default: 'student'
    },
    membershipStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'archived'],
        default: 'active'
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    // Emergency contact
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        email: String
    },
    // Next of kin
    nextOfKin: {
        name: String,
        relationship: String,
        phone: String,
        address: String
    },
    // Profile photo
    photo: {
        type: String
    },
    // Financial summary
    totalContributions: {
        type: Number,
        default: 0
    },
    totalLoans: {
        type: Number,
        default: 0
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    // Notes
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Generate member number before saving
memberSchema.pre('save', async function(next) {
    if (!this.memberNumber) {
        const count = await mongoose.model('Member').countDocuments();
        this.memberNumber = `SWA${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);

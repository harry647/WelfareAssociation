/**
 * Loan Model
 * Handles loan applications and tracking
 */

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    loanNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Loan details
    principalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    interestRate: {
        type: Number,
        default: 10, // 10% flat interest
        min: 0,
        max: 100
    },
    interestAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    // Repayment terms
    repaymentPeriod: {
        type: Number, // months
        required: true,
        min: 1,
        max: 60
    },
    monthlyPayment: {
        type: Number,
        required: true
    },
    // Loan status and tracking
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'overdue', 'defaulted'],
        default: 'pending'
    },
    applicationDate: {
        type: Date,
        default: Date.now
    },
    approvalDate: {
        type: Date
    },
    disbursementDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    // Payment tracking
    paidAmount: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    nextPaymentDate: {
        type: Date
    },
    // Penalty tracking (for overdue loans)
    penalty: {
        type: Number,
        default: 0
    },
    daysOverdue: {
        type: Number,
        default: 0
    },
    // Guarantors
    guarantors: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        name: String,
        phone: String,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending'
        },
        confirmedAt: Date
    }],
    // Loan purpose
    purpose: {
        type: String,
        enum: ['education', 'business', 'emergency', 'personal', 'housing', 'medical', 'other'],
        default: 'personal'
    },
    purposeDescription: String,
    // Payment history
    payments: [{
        date: Date,
        amount: Number,
        method: String,
        reference: String,
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            default: 'completed'
        }
    }],
    // Admin notes
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: String,
    adminNotes: String,
    // File attachments
    attachments: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: Date
    }]
}, {
    timestamps: true
});

// Generate loan number before saving
loanSchema.pre('save', async function(next) {
    if (!this.loanNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Loan').countDocuments();
        this.loanNumber = `LN/${year}/${String(count + 1).padStart(4, '0')}`;
    }
    
    // Calculate interest and total if not set
    if (this.isModified('principalAmount') || this.isModified('repaymentPeriod')) {
        this.interestAmount = (this.principalAmount * this.interestRate) / 100;
        this.totalAmount = this.principalAmount + this.interestAmount;
        this.monthlyPayment = this.totalAmount / this.repaymentPeriod;
        this.remainingBalance = this.totalAmount;
    }
    
    next();
});

// Calculate loan status
loanSchema.methods.calculateStatus = function() {
    if (this.status === 'rejected' || this.status === 'completed') {
        return this.status;
    }
    
    if (this.dueDate && new Date() > this.dueDate && this.remainingBalance > 0) {
        return 'overdue';
    }
    
    if (this.paidAmount >= this.totalAmount) {
        return 'completed';
    }
    
    if (this.status === 'approved' && this.disbursementDate) {
        return 'active';
    }
    
    return this.status;
};

module.exports = mongoose.model('Loan', loanSchema);

/**
 * Loan Model
 * Handles loan applications and tracking
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    loanNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Loan details
    principalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    interestRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 10
    },
    interestAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    // Repayment terms
    repaymentPeriod: {
        type: DataTypes.INTEGER, // months
        allowNull: false,
        validate: {
            min: 1,
            max: 60
        }
    },
    monthlyPayment: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    // Loan status and tracking
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'completed', 'overdue', 'defaulted'),
        defaultValue: 'pending'
    },
    applicationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    approvalDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    disbursementDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Payment tracking
    paidAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    remainingBalance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    nextPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Penalty tracking
    penalty: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    daysOverdue: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Guarantors (stored as JSON)
    guarantors: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Loan purpose
    purpose: {
        type: DataTypes.ENUM('education', 'business', 'emergency', 'personal', 'housing', 'medical', 'other'),
        defaultValue: 'personal'
    },
    purposeDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Payment history (stored as JSON)
    payments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Admin references
    approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rejectedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // File attachments (stored as JSON)
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'loans',
    timestamps: true
});

module.exports = Loan;

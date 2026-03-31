/**
 * Payment Model
 * Handles all payment transactions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Member reference
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    // Student ID for reference
    studentId: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Payer details
    fullName: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    paymentNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Payment type
    type: {
        type: DataTypes.ENUM('loan_repayment', 'contribution', 'savings', 'fine', 'donation', 'shares', 'welfare', 'bereavement', 'event', 'registration', 'subscription', 'other'),
        allowNull: false
    },
    // Related entity (stored as JSON)
    relatedTo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Amount
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    // Payment method
    method: {
        type: DataTypes.ENUM('cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'),
        defaultValue: 'cash'
    },
    // M-Pesa specific (stored as JSON)
    mpesa: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Payment reference
    reference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    // Dates
    paymentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    processedDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Description
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Additional notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Receipt
    receipt: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Processed by
    processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'payments',
    timestamps: true
});

module.exports = Payment;

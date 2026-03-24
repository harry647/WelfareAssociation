/**
 * Withdrawal Model
 * Handles member withdrawal requests
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Withdrawal = sequelize.define('Withdrawal', {
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
    withdrawalNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Withdrawal details
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Request details
    requestDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // Processing details
    processedDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processed'),
        defaultValue: 'pending'
    },
    // Approval/rejection details
    approvalNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Payment details (when approved)
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'mpesa', 'bank_transfer', 'cheque', 'other'),
        allowNull: true
    },
    paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // System fields
    recordedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'withdrawals',
    timestamps: true
});

module.exports = Withdrawal;

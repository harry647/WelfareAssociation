/**
 * Contribution Model
 * Handles member contributions/dues
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contribution = sequelize.define('Contribution', {
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
    contributionNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Contribution details
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    type: {
        type: DataTypes.ENUM('monthly', 'special', 'registration', 'voluntary', 'fine', 'other'),
        defaultValue: 'monthly'
    },
    period: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Payment details
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'),
        defaultValue: 'cash'
    },
    paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    // Notes
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Recorded by
    recordedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Attachments
    receipt: {
        type: DataTypes.STRING(500),
        allowNull: true
    }
}, {
    tableName: 'contributions',
    timestamps: true
});

module.exports = Contribution;

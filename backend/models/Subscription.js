/**
 * Subscription Model
 * Handles member subscription payments
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
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
    subscriptionNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    // Subscription details
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    subscriptionType: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'annual', 'lifetime'),
        defaultValue: 'monthly'
    },
    plan: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Payment details
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled', 'suspended'),
        defaultValue: 'pending'
    },
    // Dates
    startDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    autoRenew: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Metadata
    recordedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'subscriptions',
    timestamps: true
});

module.exports = Subscription;

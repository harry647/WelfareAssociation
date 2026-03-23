/**
 * Savings Model
 * Tracks member savings goals and withdrawals
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Savings = sequelize.define('Savings', {
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
    goalNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Goal details
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    targetAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    currentAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    // Status
    status: {
        type: DataTypes.ENUM('active', 'completed', 'withdrawn', 'cancelled'),
        defaultValue: 'active'
    },
    // Target date
    targetDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Transactions (stored as JSON)
    transactions: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Completion
    completedDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'savings',
    timestamps: true
});

module.exports = Savings;

/**
 * Debt Model
 * Tracks member debts and outstanding payments
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Debt = sequelize.define('Debt', {
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
    debtNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Debt type
    type: {
        type: DataTypes.ENUM('loan_overdue', 'contribution_arrears', 'fine_unpaid', 'other'),
        defaultValue: 'other'
    },
    // Amount
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    // Due date
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'overdue', 'paid', 'waived'),
        defaultValue: 'pending'
    },
    // Related entity (stored as JSON)
    relatedTo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Payment history (stored as JSON)
    payments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    paidAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    remainingBalance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    // Reminders sent (stored as JSON)
    remindersSent: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Waived
    waivedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    waiverReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    waivedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'debts',
    timestamps: true
});

module.exports = Debt;

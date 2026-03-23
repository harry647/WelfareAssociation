/**
 * Fine Model
 * Tracks fines issued to members
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fine = sequelize.define('Fine', {
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
    fineNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Fine type reference (stored as JSON)
    fineType: {
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
    // Due date
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Status
    status: {
        type: DataTypes.ENUM('unpaid', 'paid', 'waived'),
        defaultValue: 'unpaid'
    },
    // Description
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Payment
    paidDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Reminders (stored as JSON)
    remindersSent: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Issued by
    issuedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
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
    tableName: 'fines',
    timestamps: true
});

module.exports = Fine;

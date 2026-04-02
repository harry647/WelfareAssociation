/**
 * Share Model
 * Handles member share purchases/holdings
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Share = sequelize.define('Share', {
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
    shareNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    // Share details
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    numberOfShares: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    sharePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100.00
    },
    // Payment details
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'active', 'transferred'),
        defaultValue: 'pending'
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
    tableName: 'shares',
    timestamps: true
});

module.exports = Share;

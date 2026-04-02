/**
 * Registration Model
 * Handles member registration payments
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Registration = sequelize.define('Registration', {
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
    registrationNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    // Registration details
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    registrationType: {
        type: DataTypes.ENUM('new', 'renewal', 'late'),
        defaultValue: 'new'
    },
    academicYear: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    semester: {
        type: DataTypes.ENUM('first', 'second', 'third'),
        allowNull: true
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
        type: DataTypes.ENUM('pending', 'completed', 'verified', 'cancelled'),
        defaultValue: 'pending'
    },
    // Dates
    registrationDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'registrations',
    timestamps: true
});

module.exports = Registration;

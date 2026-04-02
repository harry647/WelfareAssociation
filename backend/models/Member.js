/**
 * Member Model
 * Handles member profile and membership details
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Member = sequelize.define('Member', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    memberNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        defaultValue: 'other'
    },
    // Address (stored as JSON)
    address: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Education/Institution details (stored as JSON)
    institution: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Employment details (stored as JSON)
    employment: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    membershipType: {
        type: DataTypes.ENUM('regular', 'student', 'staff', 'alumni', 'honorary'),
        defaultValue: 'regular'
    },
    membershipStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'archived'),
        defaultValue: 'active'
    },
    joinDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // Emergency contact (stored as JSON)
    emergencyContact: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Next of kin (stored as JSON)
    nextOfKin: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Profile photo
    photo: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Financial summary
    totalContributions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    totalLoans: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    totalSavings: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    // Notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'members',
    timestamps: true
});

// Virtual for full name
Member.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

module.exports = Member;

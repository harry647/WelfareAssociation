/**
 * Volunteer Model
 * Handles volunteer applications and management
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Volunteer = sequelize.define('Volunteer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Public submission fields (no auth required)
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    yearOfStudy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    area: {
        type: DataTypes.ENUM('events', 'education', 'community', 'fundraising', 'administration', 'other'),
        allowNull: false
    },
    skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    // Availability (stored as JSON)
    availability: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    experience: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    motivation: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'inactive'),
        defaultValue: 'pending'
    },
    reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    hoursContributed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Activities (stored as JSON)
    activities: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Notes (stored as JSON)
    notes: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'volunteers',
    timestamps: true
});

module.exports = Volunteer;

/**
 * Event Model
 * Handles events and activities
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Event details
    eventDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Location (stored as JSON)
    location: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Event type
    type: {
        type: DataTypes.ENUM('meeting', 'workshop', 'seminar', 'social', 'fundraiser', 'sports', 'other'),
        defaultValue: 'other'
    },
    // Registration
    requiresRegistration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    maxAttendees: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Registered attendees (stored as JSON)
    registeredAttendees: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Status
    status: {
        type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
        defaultValue: 'draft'
    },
    // Image
    image: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Organizer
    organizer: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Attachments (stored as JSON)
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'events',
    timestamps: true
});

module.exports = Event;

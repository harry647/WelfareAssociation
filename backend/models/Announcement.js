/**
 * Announcement Model
 * Handles announcement/notification data
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('general', 'urgent', 'reminder', 'event', 'news'),
        defaultValue: 'general'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
    },
    targetAudience: {
        type: DataTypes.ENUM('all', 'members', 'officers', 'executives', 'specific'),
        defaultValue: 'all'
    },
    // Specific members (stored as array of UUIDs)
    specificMembers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: []
    },
    // Sent by
    sentBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    sentAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Recipients (stored as JSON)
    recipients: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'announcements',
    timestamps: true
});

module.exports = Announcement;

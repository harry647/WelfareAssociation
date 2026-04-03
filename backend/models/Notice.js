/**
 * Notice Model
 * Handles notices and announcements
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notice = sequelize.define('Notice', {
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
    // Notice type
    type: {
        type: DataTypes.ENUM('general', 'important', 'urgent', 'event', 'meeting', 'reminder'),
        defaultValue: 'general'
    },
    // Priority
    priority: {
        type: DataTypes.ENUM('low', 'normal', 'high'),
        defaultValue: 'normal'
    },
    // Target audience
    audience: {
        type: DataTypes.ENUM('all', 'members', 'executives', 'students', 'staff'),
        defaultValue: 'all'
    },
    // Status
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    publishDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Attachments (stored as JSON)
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Author
    author: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // View count
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'notices',
    timestamps: true
});

module.exports = Notice;

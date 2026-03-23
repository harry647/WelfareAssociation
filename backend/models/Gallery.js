/**
 * Gallery Model
 * Handles gallery images and media
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Gallery = sequelize.define('Gallery', {
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
        defaultValue: ''
    },
    type: {
        type: DataTypes.ENUM('image', 'video', 'album'),
        defaultValue: 'image'
    },
    category: {
        type: DataTypes.ENUM('events', 'meetings', 'community', 'projects', 'other'),
        defaultValue: 'other'
    },
    // Images (stored as JSON)
    images: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    coverImage: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'events',
            key: 'id'
        }
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    visibility: {
        type: DataTypes.ENUM('public', 'members', 'officers', 'admin'),
        defaultValue: 'public'
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'galleries',
    timestamps: true
});

module.exports = Gallery;

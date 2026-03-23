/**
 * Document Model
 * Handles document management and storage
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    originalName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('policy', 'report', 'meeting', 'financial', 'membership', 'other'),
        defaultValue: 'other'
    },
    subcategory: {
        type: DataTypes.STRING(100),
        defaultValue: ''
    },
    visibility: {
        type: DataTypes.ENUM('public', 'members', 'officers', 'executives', 'admin'),
        defaultValue: 'members'
    },
    uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    owner: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    // Previous versions (stored as JSON)
    previousVersions: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Shared with (stored as JSON)
    sharedWith: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    archivedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    archivedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'documents',
    timestamps: true
});

module.exports = Document;

/**
 * Policy Model
 * Handles organization policies and guidelines
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Policy = sequelize.define('Policy', {
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
    category: {
        type: DataTypes.ENUM('membership', 'financial', 'loans', 'conduct', 'events', 'hr', 'general', 'other'),
        defaultValue: 'general'
    },
    version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0'
    },
    status: {
        type: DataTypes.ENUM('draft', 'pending_review', 'active', 'archived'),
        defaultValue: 'draft'
    },
    effectiveDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requiresAcknowledgment: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Acknowledgments (stored as JSON)
    acknowledgments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Attachments (stored as JSON)
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Related policies (stored as array of UUIDs)
    relatedPolicies: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: []
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
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
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'policies',
    timestamps: true
});

module.exports = Policy;

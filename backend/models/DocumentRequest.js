/**
 * DocumentRequest Model
 * Handles document access requests from members
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentRequest = sequelize.define('DocumentRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'documents',
            key: 'id'
        }
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    requestedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    purpose: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    responseNote: {
        type: DataTypes.TEXT,
        defaultValue: ''
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
    }
}, {
    tableName: 'document_requests',
    timestamps: true
});

module.exports = DocumentRequest;
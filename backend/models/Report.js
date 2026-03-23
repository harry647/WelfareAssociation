/**
 * Report Model
 * Handles report generation and management
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('contribution', 'loan', 'membership', 'financial', 'attendance', 'bereavement', 'summary', 'custom'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    generatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Parameters (stored as JSON)
    parameters: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Data (stored as JSON)
    data: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    fileUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    format: {
        type: DataTypes.ENUM('pdf', 'excel', 'csv', 'json'),
        defaultValue: 'pdf'
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    // Scheduled (stored as JSON)
    scheduled: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    isTemplate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    templateName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'reports',
    timestamps: true
});

module.exports = Report;

/**
 * Settings Model
 * Stores system configuration including payment settings
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Settings = sequelize.define('Settings', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string'
    },
    category: {
        type: DataTypes.ENUM('general', 'payment', 'security', 'api', 'email', 'sms', 'financial'),
        defaultValue: 'general'
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    isEncrypted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'settings',
    timestamps: true
});

module.exports = Settings;
/**
 * Newsletter Model
 * Handles newsletter subscriptions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Newsletter = sequelize.define('Newsletter', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    subscribedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    unsubscribedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    source: {
        type: DataTypes.ENUM('website', 'registration', 'event', 'manual'),
        defaultValue: 'website'
    }
}, {
    tableName: 'newsletters',
    timestamps: true
});

module.exports = Newsletter;

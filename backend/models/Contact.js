/**
 * Contact Model
 * Handles contact inquiries and messages
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('general', 'membership', 'contribution', 'loan', 'technical', 'feedback', 'complaint', 'other'),
        defaultValue: 'general'
    },
    status: {
        type: DataTypes.ENUM('new', 'read', 'replied', 'resolved', 'closed'),
        defaultValue: 'new'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    repliedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    repliedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Attachments (stored as JSON)
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    readBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'contacts',
    timestamps: true
});

module.exports = Contact;

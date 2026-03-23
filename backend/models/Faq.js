/**
 * FAQ Model
 * Handles Frequently Asked Questions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Faq = sequelize.define('Faq', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    question: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('membership', 'contributions', 'loans', 'events', 'general', 'technical', 'other'),
        defaultValue: 'general'
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    helpful: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    notHelpful: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
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
    }
}, {
    tableName: 'faqs',
    timestamps: true
});

module.exports = Faq;

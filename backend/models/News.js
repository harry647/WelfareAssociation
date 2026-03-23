/**
 * News Model
 * Handles news articles and updates
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
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
    excerpt: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Category
    category: {
        type: DataTypes.ENUM('announcement', 'update', 'success_story', 'press_release', 'other'),
        defaultValue: 'announcement'
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
    // Featured image
    image: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Author
    author: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Tags (stored as array)
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    // View count
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Featured
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'news',
    timestamps: true
});

module.exports = News;

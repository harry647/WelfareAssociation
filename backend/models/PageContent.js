/**
 * PageContent Model
 * Handles dynamic page content that can be managed from admin dashboard
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PageContent = sequelize.define('PageContent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Page identifier (e.g., 'about-us', 'welcome-page', 'contact-information')
    pageIdentifier: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    // Section identifier within the page (e.g., 'hero', 'mission', 'team')
    sectionIdentifier: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Content title
    title: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // Main content (HTML allowed)
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Secondary content or subtitle
    subtitle: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Additional data stored as JSON (for images, links, etc.)
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    // Order for display
    displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Status: active/inactive
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Created/Updated by
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
    tableName: 'page_contents',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['page_identifier', 'section_identifier']
        }
    ]
});

module.exports = PageContent;
/**
 * Bereavement Model
 * Handles bereavement support and contributions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bereavement = sequelize.define('Bereavement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Deceased information (stored as JSON)
    deceased: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
    },
    // Member (the one who lost a loved one)
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    // Status
    status: {
        type: DataTypes.ENUM('pending', 'active', 'closed'),
        defaultValue: 'pending'
    },
    // Contributions from other members (stored as JSON)
    contributions: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    totalContributions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    // Messages of condolence (stored as JSON)
    messages: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    // Notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Created by
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'bereavements',
    timestamps: true
});

module.exports = Bereavement;

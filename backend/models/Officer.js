/**
 * Officer Model
 * Handles executive officers and their positions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Officer = sequelize.define('Officer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    position: {
        type: DataTypes.ENUM('chairman', 'vice-chairman', 'secretary', 'treasurer', 'pro', 'committee-head', 'member'),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'executive'),
        allowNull: false
    },
    department: {
        type: DataTypes.ENUM('finance', 'events', 'welfare', 'academic', 'sports', 'communications'),
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated'),
        defaultValue: 'active'
    },
    accountStatus: {
        type: DataTypes.ENUM('active', 'pending', 'suspended'),
        defaultValue: 'pending'
    },
    // Store member data at time of appointment (snapshot)
    memberDataSnapshot: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
    },
    // Account creation data
    accountData: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Notification preferences
    notifications: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    // Notes and remarks
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Appointment metadata
    appointedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    appointmentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'officers',
    timestamps: true,
    indexes: [
        {
            fields: ['memberId']
        },
        {
            fields: ['userId']
        },
        {
            fields: ['position']
        },
        {
            fields: ['role']
        },
        {
            fields: ['status']
        },
        {
            fields: ['startDate']
        }
    ]
});

// Virtual for full name
Officer.prototype.getFullName = function() {
    const snapshot = this.memberDataSnapshot || {};
    return `${snapshot.firstName || ''} ${snapshot.lastName || ''}`.trim();
};

// Virtual for position display name
Officer.prototype.getPositionDisplay = function() {
    const positions = {
        'chairman': 'Chairman',
        'vice-chairman': 'Vice Chairman',
        'secretary': 'Secretary',
        'treasurer': 'Treasurer',
        'pro': 'Public Relations Officer',
        'committee-head': 'Committee Head',
        'member': 'Executive Member'
    };
    return positions[this.position] || this.position;
};

// Virtual for role display name
Officer.prototype.getRoleDisplay = function() {
    return this.role.charAt(0).toUpperCase() + this.role.slice(1);
};

// Check if officer is currently active
Officer.prototype.isActive = function() {
    const now = new Date();
    const startDate = new Date(this.startDate);
    const endDate = this.endDate ? new Date(this.endDate) : null;
    
    return this.status === 'active' && 
           now >= startDate && 
           (!endDate || now <= endDate);
};

module.exports = Officer;

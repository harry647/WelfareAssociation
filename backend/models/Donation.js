/**
 * Donation Model
 * Handles all types of donations: one-time, monthly, scholarship, corporate, in-kind
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Donation = sequelize.define('Donation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('one-time', 'monthly', 'scholarship', 'corporate', 'inkind'),
        allowNull: false,
        comment: 'Type of donation'
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
        defaultValue: 'pending',
        comment: 'Donation status'
    },
    
    // Donor Information
    donorName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'donorName',
        validate: {
            notEmpty: true,
            len: [2, 200]
        }
    },
    donorEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'donorEmail',
        validate: {
            isEmail: true
        }
    },
    donorPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'donorPhone',
        validate: {
            is: /^$|^[0-9+\-\s()]+$/
        }
    },
    
    // Financial Information
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'amount',
        validate: {
            min: {
                args: [0],
                msg: 'Amount cannot be negative'
            }
        },
        comment: 'Donation amount (optional for corporate and in-kind donations)'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'paymentMethod',
        validate: {
            isIn: [['mpesa', 'bank', 'cash']]
        },
        comment: 'Payment method (null for in-kind donations)'
    },
    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'transactionId',
        comment: 'Transaction ID for bank/M-Pesa payments'
    },
    
    // Monthly Donation Specific
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'startDate',
        comment: 'Start date for monthly donations'
    },
    duration: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'duration',
        comment: 'Duration for monthly donations'
    },
    
    // Scholarship Specific
    sponsorshipType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'sponsorshipType',
        comment: 'Type of scholarship sponsorship'
    },
    focusArea: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'focusArea',
        comment: 'Field of study focus for scholarship'
    },
    
    // Corporate Specific
    companyName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'companyName',
        comment: 'Company name for corporate donations'
    },
    contactPerson: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'contactPerson',
        comment: 'Contact person for corporate donations'
    },
    companyEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'companyEmail',
        comment: 'Company email for corporate donations'
    },
    companyPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'companyPhone',
        comment: 'Company phone for corporate donations'
    },
    partnershipType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'partnershipType',
        comment: 'Type of corporate partnership'
    },
    proposedContribution: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'proposedContribution',
        comment: 'Description of proposed corporate contribution'
    },
    
    // In-Kind Specific
    category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'category',
        comment: 'Category for in-kind donations'
    },
    itemDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'itemDescription',
        comment: 'Description of in-kind items'
    },
    itemQuantity: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'quantity',
        validate: {
            isInt: function(value) {
                if (value && value !== '' && parseInt(value) < 1) {
                    throw new Error('Quantity must be at least 1');
                }
            }
        },
        comment: 'Quantity of in-kind items'
    },
    itemCondition: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'condition',
        comment: 'Condition of in-kind items'
    },
    pickupOption: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'pickupOption',
        comment: 'Pickup preference for in-kind donations'
    },
    
    // Common Fields
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'message',
        validate: {
            len: [0, 1000]
        },
        comment: 'Donor message or additional information'
    },
    anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'anonymous',
        comment: 'Whether donation should be anonymous'
    },
    
    // Admin/Processing Fields
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paymentDate',
        comment: 'Date payment was confirmed'
    },
    receiptIssued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'receiptIssued',
        comment: 'Whether receipt has been issued'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Admin notes about the donation'
    },
    
    // Timestamps
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'createdAt'
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updatedAt'
    }
}, {
    tableName: 'donations',
    timestamps: true,
    indexes: [
        {
            fields: ['type']
        },
        {
            fields: ['status']
        },
        {
            fields: ['donorEmail']
        },
        {
            fields: ['createdAt']
        },
        {
            fields: ['paymentDate']
        }
    ]
});

// Instance methods
Donation.prototype.getDonorInfo = function() {
    return {
        name: this.donorName,
        email: this.donorEmail,
        phone: this.donorPhone
    };
};

Donation.prototype.getFormattedAmount = function() {
    return this.amount ? `Ksh ${parseFloat(this.amount).toLocaleString()}` : 'N/A';
};

Donation.prototype.getTypeLabel = function() {
    const typeLabels = {
        'one-time': 'One-Time Donation',
        'monthly': 'Monthly Giving',
        'scholarship': 'Scholarship Sponsorship',
        'corporate': 'Corporate Partnership',
        'inkind': 'In-Kind Donation'
    };
    return typeLabels[this.type] || this.type;
};

// Class methods
Donation.getStats = async function() {
    const stats = await Donation.findAll({
        attributes: [
            'type',
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
        ],
        group: ['type', 'status']
    });
    return stats;
};

Donation.getByType = async function(type, limit = 10) {
    return await Donation.findAll({
        where: { type },
        order: [['createdAt', 'DESC']],
        limit
    });
};

Donation.getByStatus = async function(status, limit = 10) {
    return await Donation.findAll({
        where: { status },
        order: [['createdAt', 'DESC']],
        limit
    });
};

Donation.getPendingCount = async function() {
    const count = await Donation.count({
        where: { status: 'pending' }
    });
    return count;
};

module.exports = Donation;

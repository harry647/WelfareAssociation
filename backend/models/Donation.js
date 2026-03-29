/**
 * Donation Model
 * Handles all types of donations: one-time, monthly, scholarship, corporate, in-kind
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
            validate: {
                notEmpty: true,
                len: [2, 200]
            }
        },
        donorEmail: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        donorPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^254[0-9]{9}$/
            }
        },
        
        // Financial Information
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: {
                min: 0
            },
            comment: 'Donation amount (null for in-kind donations)'
        },
        paymentMethod: {
            type: DataTypes.ENUM('mpesa', 'bank', 'cash', 'cheque', 'other'),
            allowNull: true,
            comment: 'Payment method (null for in-kind donations)'
        },
        transactionId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Transaction ID for bank/M-Pesa payments'
        },
        
        // Monthly Donation Specific
        monthlyStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Start date for monthly donations'
        },
        monthlyDuration: {
            type: DataTypes.ENUM('ongoing', '6months', '12months'),
            allowNull: true,
            defaultValue: 'ongoing',
            comment: 'Duration for monthly donations'
        },
        
        // Scholarship Specific
        sponsorshipType: {
            type: DataTypes.ENUM('full', 'semester', 'partial', 'custom'),
            allowNull: true,
            comment: 'Type of scholarship sponsorship'
        },
        sponsorshipDuration: {
            type: DataTypes.ENUM('one-time', 'monthly', 'quarterly'),
            allowNull: true,
            comment: 'Payment frequency for scholarship'
        },
        scholarshipFocus: {
            type: DataTypes.ENUM('any', 'science', 'business', 'arts', 'health'),
            allowNull: true,
            defaultValue: 'any',
            comment: 'Field of study focus for scholarship'
        },
        
        // Corporate Specific
        companyName: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Company name for corporate donations'
        },
        contactPerson: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Contact person for corporate donations'
        },
        partnershipType: {
            type: DataTypes.ENUM('sponsor', 'scholarship', 'mentorship', 'infrastructure', 'custom'),
            allowNull: true,
            comment: 'Type of corporate partnership'
        },
        proposedContribution: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Description of proposed corporate contribution'
        },
        
        // In-Kind Specific
        donationCategory: {
            type: DataTypes.ENUM('books', 'laptops', 'food', 'clothing', 'stationery', 'other'),
            allowNull: true,
            comment: 'Category for in-kind donations'
        },
        itemDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Description of in-kind items'
        },
        itemQuantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1
            },
            comment: 'Quantity of in-kind items'
        },
        itemCondition: {
            type: DataTypes.ENUM('new', 'like-new', 'good', 'fair'),
            allowNull: true,
            defaultValue: 'good',
            comment: 'Condition of in-kind items'
        },
        pickupOption: {
            type: DataTypes.ENUM('dropoff', 'pickup'),
            allowNull: true,
            defaultValue: 'dropoff',
            comment: 'Pickup preference for in-kind donations'
        },
        
        // Common Fields
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Donor message or additional information'
        },
        anonymous: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether donation should be anonymous'
        },
        
        // Admin/Processing Fields
        paymentDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date payment was confirmed'
        },
        receiptIssued: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether receipt has been issued'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Admin notes about the donation'
        },
        
        // Metadata
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
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

    // Associations
    Donation.associate = function(models) {
        // If you need to associate with User who recorded the donation
        Donation.belongsTo(models.User, {
            foreignKey: 'recordedBy',
            as: 'recorder'
        });
    };

    // Instance Methods
    Donation.prototype.toJSON = function() {
        const values = Object.assign({}, this.get());
        
        // Remove sensitive fields if needed
        if (!this.anonymous) {
            return values;
        }
        
        // Return anonymous version
        return {
            ...values,
            donorName: 'Anonymous',
            donorEmail: 'anonymous@donor.org',
            donorPhone: null
        };
    };

    // Class Methods
    Donation.findByType = function(type) {
        return this.findAll({
            where: { type },
            order: [['createdAt', 'DESC']]
        });
    };

    Donation.findPending = function() {
        return this.findAll({
            where: { status: 'pending' },
            order: [['createdAt', 'ASC']]
        });
    };

    Donation.getStats = async function() {
        const stats = await this.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
                'type',
                'status'
            ],
            group: ['type', 'status']
        });
        
        return stats;
    };

    return Donation;
};

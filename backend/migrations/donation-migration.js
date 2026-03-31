/**
 * Donation Table Migration
 * Creates donations table if it doesn't exist
 */

const { sequelize } = require('../config/database');

async function runDonationMigration() {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        console.log('✓ Checking donations table...');
        
        // Check if donations table exists
        try {
            await queryInterface.describeTable('donations');
            console.log('✓ Donations table already exists');
        } catch (error) {
            console.log('→ Creating donations table...');
            // Table doesn't exist, create it
            await queryInterface.createTable('donations', {
                id: {
                    type: sequelize.Sequelize.UUID,
                    defaultValue: sequelize.Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false
                },
                type: {
                    type: sequelize.Sequelize.ENUM('one-time', 'monthly', 'scholarship', 'corporate', 'inkind'),
                    allowNull: false
                },
                status: {
                    type: sequelize.Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled'),
                    defaultValue: 'pending',
                    allowNull: false
                },
                donorName: {
                    type: sequelize.Sequelize.STRING(200),
                    allowNull: false
                },
                donorEmail: {
                    type: sequelize.Sequelize.STRING(255),
                    allowNull: true,
                    validate: {
                        isEmail: true
                    }
                },
                donorPhone: {
                    type: sequelize.Sequelize.STRING(20),
                    allowNull: true
                },
                amount: {
                    type: sequelize.Sequelize.DECIMAL(10, 2),
                    allowNull: false
                },
                paymentMethod: {
                    type: sequelize.Sequelize.STRING(50),
                    allowNull: true
                },
                transactionId: {
                    type: sequelize.Sequelize.STRING(100),
                    allowNull: true
                },
                message: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: true
                },
                anonymous: {
                    type: sequelize.Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                },
                // Monthly donation fields
                startDate: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: true
                },
                duration: {
                    type: sequelize.Sequelize.STRING(50),
                    allowNull: true
                },
                // Scholarship fields
                sponsorshipType: {
                    type: sequelize.Sequelize.STRING(50),
                    allowNull: true
                },
                focusArea: {
                    type: sequelize.Sequelize.STRING(100),
                    allowNull: true
                },
                // Corporate fields
                companyName: {
                    type: sequelize.Sequelize.STRING(200),
                    allowNull: true
                },
                contactPerson: {
                    type: sequelize.Sequelize.STRING(200),
                    allowNull: true
                },
                companyEmail: {
                    type: sequelize.Sequelize.STRING(255),
                    allowNull: true
                },
                companyPhone: {
                    type: sequelize.Sequelize.STRING(20),
                    allowNull: true
                },
                partnershipType: {
                    type: sequelize.Sequelize.STRING(100),
                    allowNull: true
                },
                proposedContribution: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: true
                },
                // In-kind fields
                category: {
                    type: sequelize.Sequelize.STRING(100),
                    allowNull: true
                },
                itemDescription: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: true
                },
                quantity: {
                    type: sequelize.Sequelize.STRING(100),
                    allowNull: true
                },
                condition: {
                    type: sequelize.Sequelize.STRING(50),
                    allowNull: true
                },
                pickupOption: {
                    type: sequelize.Sequelize.STRING(50),
                    allowNull: true
                },
                createdAt: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: false,
                    defaultValue: sequelize.Sequelize.NOW
                },
                updatedAt: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: false,
                    defaultValue: sequelize.Sequelize.NOW
                }
            });
            console.log('✓ Donations table created');
        }
        
        console.log('✓ Donation table migration completed successfully');
        return true;
        
    } catch (error) {
        console.error('✗ Donation migration failed:', error.message);
        return false;
    }
}

module.exports = { runDonationMigration };

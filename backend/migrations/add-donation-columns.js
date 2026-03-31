/**
 * Add Missing Columns to Donations Table
 * Adds paymentDate, receiptIssued, and notes columns to existing donations table
 */

const { sequelize } = require('../config/database');

async function addMissingDonationColumns() {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        console.log('→ Adding missing columns to donations table...');
        
        // Add paymentDate column
        try {
            await queryInterface.addColumn('donations', 'paymentDate', {
                type: sequelize.Sequelize.DATE,
                allowNull: true,
                comment: 'Date payment was confirmed'
            });
            console.log('✓ Added paymentDate column');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ paymentDate column already exists');
            } else {
                throw error;
            }
        }
        
        // Add receiptIssued column
        try {
            await queryInterface.addColumn('donations', 'receiptIssued', {
                type: sequelize.Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether receipt has been issued'
            });
            console.log('✓ Added receiptIssued column');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ receiptIssued column already exists');
            } else {
                throw error;
            }
        }
        
        // Add notes column
        try {
            await queryInterface.addColumn('donations', 'notes', {
                type: sequelize.Sequelize.TEXT,
                allowNull: true,
                comment: 'Admin notes about the donation'
            });
            console.log('✓ Added notes column');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ notes column already exists');
            } else {
                throw error;
            }
        }
        
        console.log('✓ Successfully added missing columns to donations table');
        return true;
        
    } catch (error) {
        console.error('✗ Failed to add missing columns:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    addMissingDonationColumns()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Migration error:', error);
            process.exit(1);
        });
}

module.exports = { addMissingDonationColumns };

/**
 * Check Donation Table Schema
 */

require('dotenv').config();
const { sequelize } = require('./backend/config/database');

async function checkDonationTable() {
    console.log('🔍 Checking donations table schema...');
    
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        // Get table description
        const tableInfo = await queryInterface.describeTable('donations');
        
        console.log('📊 Donations table columns:');
        Object.keys(tableInfo).forEach(columnName => {
            console.log(`   - ${columnName}: ${tableInfo[columnName].type} (nullable: ${tableInfo[columnName].allowNull})`);
        });
        
    } catch (error) {
        console.error('❌ Error checking table:', error);
    } finally {
        await sequelize.close();
    }
}

// Run the check
checkDonationTable();

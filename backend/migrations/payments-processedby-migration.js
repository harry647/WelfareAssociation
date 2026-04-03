/**
 * Migration to update payments table
 * Makes processedBy field nullable to handle system-generated payments
 */

// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

async function up() {
    try {
        await sequelize.query(`
            ALTER TABLE "payments" 
            ALTER COLUMN "processed_by" DROP NOT NULL
        `);
        console.log('Successfully made processed_by field nullable in payments table');
    } catch (error) {
        console.error('Error updating payments table:', error);
        throw error;
    }
}

async function down() {
    try {
        await sequelize.query(`
            ALTER TABLE "payments" 
            ALTER COLUMN "processed_by" SET NOT NULL
        `);
        console.log('Successfully restored processed_by field to NOT NULL in payments table');
    } catch (error) {
        console.error('Error reverting payments table:', error);
        throw error;
    }
}

module.exports = { up, down };

// Run migration if called directly
if (require.main === module) {
    up().catch(console.error);
}

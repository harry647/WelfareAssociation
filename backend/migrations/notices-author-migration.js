/**
 * Migration to update notices table
 * Makes author field nullable to allow system-generated notices
 */

// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

async function up() {
    try {
        await sequelize.query(`
            ALTER TABLE "notices" 
            ALTER COLUMN "author" DROP NOT NULL
        `);
        console.log('Successfully made author field nullable in notices table');
    } catch (error) {
        console.error('Error updating notices table:', error);
        throw error;
    }
}

async function down() {
    try {
        await sequelize.query(`
            ALTER TABLE "notices" 
            ALTER COLUMN "author" SET NOT NULL
        `);
        console.log('Successfully restored author field to NOT NULL in notices table');
    } catch (error) {
        console.error('Error reverting notices table:', error);
        throw error;
    }
}

module.exports = { up, down };

// Run migration if called directly
if (require.main === module) {
    up().catch(console.error);
}

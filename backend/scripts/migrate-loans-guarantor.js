/**
 * Migration: Add guarantor columns to loans table
 * Adds missing columns: guarantor_status, guarantor_response_date, guarantor_response_note
 */

const path = require('path');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const { sequelize } = require('../config/database');

async function migrate() {
    console.log('Starting migration: Add guarantor columns to loans table');
    console.log('Using POSTGRES_URI:', process.env.POSTGRES_URI ? 'set' : 'NOT SET');
    
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established');
        
        // Check if column exists before adding
        const tableDescription = await queryInterface.describeTable('loans');
        console.log('Current loans table columns:', Object.keys(tableDescription));
        
        // Add guarantor_status column if it doesn't exist
        if (!tableDescription.guarantor_status) {
            console.log('Adding guarantor_status column...');
            await queryInterface.addColumn('loans', 'guarantor_status', {
                type: sequelize.Sequelize.ENUM('pending', 'accepted', 'rejected', 'not_required'),
                defaultValue: 'pending',
                allowNull: true
            });
            console.log('✓ guarantor_status column added successfully');
        } else {
            console.log('✓ guarantor_status column already exists');
        }
        
        // Add guarantor_response_date column if it doesn't exist
        if (!tableDescription.guarantor_response_date) {
            console.log('Adding guarantor_response_date column...');
            await queryInterface.addColumn('loans', 'guarantor_response_date', {
                type: sequelize.Sequelize.DATE,
                allowNull: true
            });
            console.log('✓ guarantor_response_date column added successfully');
        } else {
            console.log('✓ guarantor_response_date column already exists');
        }
        
        // Add guarantor_response_note column if it doesn't exist
        if (!tableDescription.guarantor_response_note) {
            console.log('Adding guarantor_response_note column...');
            await queryInterface.addColumn('loans', 'guarantor_response_note', {
                type: sequelize.Sequelize.TEXT,
                allowNull: true
            });
            console.log('✓ guarantor_response_note column added successfully');
        } else {
            console.log('✓ guarantor_response_note column already exists');
        }
        
        console.log('\n✓ Migration completed successfully!');
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

migrate();
/**
 * Standalone Migration Runner
 * Run specific migrations without running all migrations
 */

// Set environment variables to force PostgreSQL usage
process.env.POSTGRES_URI_DEV = 'postgresql://postgres:HarryPostgres4656!!@127.0.0.1:5432/swa_db';
process.env.NODE_ENV = 'development';

const { sequelize } = require('./backend/config/database');
const addExecutiveRole = require('./backend/migrations/20260403-add-executive-role');

async function runExecutiveRoleMigration() {
    try {
        console.log('🔄 Running executive role migration...');
        
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        
        const queryInterface = sequelize.getQueryInterface();
        const { Sequelize } = require('sequelize');
        
        // Run the migration
        await addExecutiveRole.up(queryInterface, Sequelize);
        
        console.log('✅ Executive role migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run the migration
runExecutiveRoleMigration();

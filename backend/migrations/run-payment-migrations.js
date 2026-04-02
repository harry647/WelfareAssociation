/**
 * Migration Runner
 * Runs all pending migrations for the new payment models
 */

const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Import migration modules
const createShares = require('./20260402-create-shares');
const createRegistrations = require('./20260402-create-registrations');
const createSubscriptions = require('./20260402-create-subscriptions');

async function runMigrations() {
    try {
        console.log('🚀 Starting migrations for new payment models...\n');
        
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Run migrations in order
        const migrations = [
            { name: 'shares', module: createShares },
            { name: 'registrations', module: createRegistrations },
            { name: 'subscriptions', module: createSubscriptions }
        ];
        
        for (const migration of migrations) {
            console.log(`\n📋 Creating ${migration.name} table...`);
            
            try {
                await migration.module.up(sequelize.getQueryInterface(), sequelize.Sequelize);
                console.log(`✅ ${migration.name} table created successfully`);
            } catch (error) {
                // Check if table already exists
                if (error.message.includes('already exists') || error.message.includes('already exists')) {
                    console.log(`⚠️  ${migration.name} table already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('\n🎉 All migrations completed successfully!');
        console.log('\n📊 New tables created:');
        console.log('   • shares - Member share purchases and holdings');
        console.log('   • registrations - Member registration payments');
        console.log('   • subscriptions - Member subscription payments');
        console.log('\n💡 Your payment system is now ready to handle all 12 payment types!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('📋 Full error details:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Rollback function (if needed)
async function rollbackMigrations() {
    try {
        console.log('🔄 Rolling back migrations...\n');
        
        const migrations = [
            { name: 'subscriptions', module: createSubscriptions },
            { name: 'registrations', module: createRegistrations },
            { name: 'shares', module: createShares }
        ];
        
        for (const migration of migrations) {
            console.log(`📋 Dropping ${migration.name} table...`);
            
            try {
                await migration.module.down(sequelize.getQueryInterface(), sequelize.Sequelize);
                console.log(`✅ ${migration.name} table dropped successfully`);
            } catch (error) {
                console.log(`⚠️  ${migration.name} table doesn't exist, skipping...`);
            }
        }
        
        console.log('\n🎉 Rollback completed!');
        
    } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'rollback') {
    rollbackMigrations();
} else {
    runMigrations();
}

module.exports = { runMigrations, rollbackMigrations };

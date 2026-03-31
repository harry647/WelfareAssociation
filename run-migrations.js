/**
 * Manual Migration Runner
 * Run this script to apply database migrations manually
 */

require('dotenv').config();
const { runAllMigrations } = require('./backend/migrations');

async function runMigrations() {
    console.log('🚀 Starting manual database migrations...');
    
    try {
        const success = await runAllMigrations();
        
        if (success) {
            console.log('\n🎉 Migrations completed successfully!');
            console.log('You can now restart your server and the volunteer application should work.');
        } else {
            console.log('\n❌ Migrations failed. Please check the error messages above.');
        }
        
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('\n💥 Migration error:', error);
        process.exit(1);
    }
}

// Run migrations
runMigrations();

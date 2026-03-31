/**
 * Migration Runner
 * Handles all database migrations
 */

const { runVolunteerMigration } = require('./volunteer-migration');
const { runVolunteerConstraintsMigration } = require('./volunteer-constraints-migration');
const { runLoanMigration } = require('./loan-migration');

async function runAllMigrations() {
    console.log('\n🔄 Running database migrations...');
    
    try {
        // Run loan migration
        console.log('\n📋 Running loan migrations...');
        const loanSuccess = await runLoanMigration();
        
        // Run volunteer migration
        console.log('\n🤝 Running volunteer migrations...');
        const volunteerSuccess = await runVolunteerMigration();
        
        // Run volunteer constraints migration
        console.log('\n🔧 Running volunteer constraints migrations...');
        const constraintsSuccess = await runVolunteerConstraintsMigration();
        
        if (loanSuccess && volunteerSuccess && constraintsSuccess) {
            console.log('\n✅ All migrations completed successfully');
        } else {
            console.log('\n⚠️ Some migrations failed');
        }
        
        return loanSuccess && volunteerSuccess && constraintsSuccess;
        
    } catch (error) {
        console.error('\n❌ Migration runner error:', error);
        return false;
    }
}

module.exports = { runAllMigrations };

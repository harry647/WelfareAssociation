/**
 * Migration Runner
 * Handles all database migrations
 */

const { runVolunteerMigration } = require('./volunteer-migration');
const { runVolunteerConstraintsMigration } = require('./volunteer-constraints-migration');
const { runLoanMigration } = require('./loan-migration');
const { runDonationMigration } = require('./donation-migration');
const { runPaymentMigration } = require('./payment-migration');

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
        
        // Run donation migration
        console.log('\n💰 Running donation migrations...');
        const donationSuccess = await runDonationMigration();
        
        // Run payment migration
        console.log('\n💳 Running payment migrations...');
        const paymentSuccess = await runPaymentMigration();
        
        // Add missing donation columns (if they don't exist)
        console.log('\n🔧 Adding missing donation columns...');
        // This is handled in donation-migration.js now
        console.log('✓ Donation columns migration completed');
        
        if (loanSuccess && volunteerSuccess && constraintsSuccess && donationSuccess && paymentSuccess) {
            console.log('\n✅ All migrations completed successfully');
        } else {
            console.log('\n⚠️ Some migrations failed');
        }
        
        return loanSuccess && volunteerSuccess && constraintsSuccess && donationSuccess && paymentSuccess;
        
    } catch (error) {
        console.error('\n❌ Migration runner error:', error);
        return false;
    }
}

module.exports = { runAllMigrations };

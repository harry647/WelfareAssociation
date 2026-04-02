/**
 * Migration Runner
 * Handles all database migrations
 */

const { runVolunteerMigration } = require('./volunteer-migration');
const { runVolunteerConstraintsMigration } = require('./volunteer-constraints-migration');
const { runLoanMigration } = require('./loan-migration');
const { runDonationMigration } = require('./donation-migration');
const { runPaymentMigration } = require('./payment-migration');
const { runWithdrawalMigration } = require('./withdrawal-fields-migration');

// Import new payment model migrations
const createShares = require('./20260402-create-shares');
const createRegistrations = require('./20260402-create-registrations');
const createSubscriptions = require('./20260402-create-subscriptions');

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
        
        // Run withdrawal migration
        console.log('\n💸 Running withdrawal migrations...');
        const withdrawalSuccess = await runWithdrawalMigration();
        
        // Run new payment model migrations
        console.log('\n📋 Running new payment model migrations...');
        const { sequelize } = require('../config/database');
        let sharesSuccess = true, registrationsSuccess = true, subscriptionsSuccess = true;
        
        try {
            // Create shares table
            console.log('\n📊 Creating shares table...');
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "shares" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "member_id" UUID NOT NULL REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                    "share_number" VARCHAR(30) NOT NULL UNIQUE,
                    "amount" DECIMAL(15,2) NOT NULL,
                    "number_of_shares" INTEGER NOT NULL DEFAULT 1,
                    "share_price" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
                    "payment_date" TIMESTAMP WITH TIME ZONE,
                    "payment_reference" VARCHAR(100),
                    "status" VARCHAR(20) DEFAULT 'pending',
                    "recorded_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
                    "notes" TEXT,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `);
            await sequelize.query('CREATE INDEX IF NOT EXISTS "shares_member_id" ON "shares" ("member_id");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "shares_status" ON "shares" ("status");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "shares_share_number" ON "shares" ("share_number");');
            console.log('✅ Shares table created successfully');
        } catch (error) {
            console.error('❌ Shares migration failed:', error.message);
            sharesSuccess = false;
        }
        
        try {
            // Create registrations table
            console.log('\n📊 Creating registrations table...');
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "registrations" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "member_id" UUID NOT NULL REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                    "registration_number" VARCHAR(30) NOT NULL UNIQUE,
                    "amount" DECIMAL(15,2) NOT NULL,
                    "registration_type" VARCHAR(20) DEFAULT 'new',
                    "academic_year" VARCHAR(20),
                    "semester" VARCHAR(10),
                    "payment_date" TIMESTAMP WITH TIME ZONE,
                    "payment_reference" VARCHAR(100),
                    "status" VARCHAR(20) DEFAULT 'pending',
                    "registration_date" TIMESTAMP WITH TIME ZONE,
                    "expiry_date" TIMESTAMP WITH TIME ZONE,
                    "recorded_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
                    "notes" TEXT,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `);
            await sequelize.query('CREATE INDEX IF NOT EXISTS "registrations_member_id" ON "registrations" ("member_id");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "registrations_status" ON "registrations" ("status");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "registrations_registration_number" ON "registrations" ("registration_number");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "registrations_academic_year" ON "registrations" ("academic_year");');
            console.log('✅ Registrations table created successfully');
        } catch (error) {
            console.error('❌ Registrations migration failed:', error.message);
            registrationsSuccess = false;
        }
        
        try {
            // Create subscriptions table
            console.log('\n📊 Creating subscriptions table...');
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "subscriptions" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "member_id" UUID NOT NULL REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                    "subscription_number" VARCHAR(30) NOT NULL UNIQUE,
                    "amount" DECIMAL(15,2) NOT NULL,
                    "subscription_type" VARCHAR(20) DEFAULT 'monthly',
                    "plan" VARCHAR(50),
                    "payment_date" TIMESTAMP WITH TIME ZONE,
                    "last_payment_date" TIMESTAMP WITH TIME ZONE,
                    "payment_reference" VARCHAR(100),
                    "status" VARCHAR(20) DEFAULT 'pending',
                    "start_date" TIMESTAMP WITH TIME ZONE,
                    "end_date" TIMESTAMP WITH TIME ZONE,
                    "auto_renew" BOOLEAN DEFAULT false,
                    "recorded_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
                    "notes" TEXT,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `);
            await sequelize.query('CREATE INDEX IF NOT EXISTS "subscriptions_member_id" ON "subscriptions" ("member_id");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "subscriptions_status" ON "subscriptions" ("status");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "subscriptions_subscription_number" ON "subscriptions" ("subscription_number");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "subscriptions_subscription_type" ON "subscriptions" ("subscription_type");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "subscriptions_end_date" ON "subscriptions" ("end_date");');
            console.log('✅ Subscriptions table created successfully');
        } catch (error) {
            console.error('❌ Subscriptions migration failed:', error.message);
            subscriptionsSuccess = false;
        }
        
        try {
            // Create settings table
            console.log('\n📊 Creating settings table...');
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "settings" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "key" VARCHAR(100) NOT NULL UNIQUE,
                    "value" TEXT,
                    "type" VARCHAR(20) DEFAULT 'string',
                    "category" VARCHAR(20) DEFAULT 'general',
                    "description" VARCHAR(500),
                    "is_encrypted" BOOLEAN DEFAULT false,
                    "updated_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `);
            await sequelize.query('CREATE INDEX IF NOT EXISTS "settings_key" ON "settings" ("key");');
            await sequelize.query('CREATE INDEX IF NOT EXISTS "settings_category" ON "settings" ("category");');
            console.log('✅ Settings table created successfully');
            
            // Insert default settings
            console.log('\n📝 Inserting default settings...');
            await sequelize.query(`
                INSERT INTO "settings" ("key", "value", "type", "category", "description") 
                VALUES ('welfare_balance', '0', 'string', 'financial', 'Current welfare fund balance')
                ON CONFLICT ("key") DO NOTHING;
            `);
            console.log('✅ Default settings inserted');
        } catch (error) {
            console.error('❌ Settings migration failed:', error.message);
            // Don't fail the migration for settings table
        }
        
        // Add missing donation columns (if they don't exist)
        console.log('\n🔧 Adding missing donation columns...');
        // This is handled in donation-migration.js now
        console.log('✓ Donation columns migration completed');
        
        if (loanSuccess && volunteerSuccess && constraintsSuccess && donationSuccess && paymentSuccess && withdrawalSuccess && sharesSuccess && registrationsSuccess && subscriptionsSuccess) {
            console.log('\n✅ All migrations completed successfully');
        } else {
            console.log('\n⚠️ Some migrations failed');
        }
        
        return loanSuccess && volunteerSuccess && constraintsSuccess && donationSuccess && paymentSuccess && withdrawalSuccess && sharesSuccess && registrationsSuccess && subscriptionsSuccess;
        
    } catch (error) {
        console.error('\n❌ Migration runner error:', error);
        return false;
    }
}

module.exports = { runAllMigrations };

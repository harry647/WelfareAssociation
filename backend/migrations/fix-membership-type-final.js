/**
 * Final migration to fix membership_type enum to use lowercase values
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        // Step 1: Update existing values to lowercase
        console.log('Step 1: Updating existing values to lowercase...');
        await sequelize.query("UPDATE members SET membership_type = 'student' WHERE membership_type = 'Student'");
        await sequelize.query("UPDATE members SET membership_type = 'staff' WHERE membership_type = 'Staff'");
        await sequelize.query("UPDATE members SET membership_type = 'alumni' WHERE membership_type = 'Alumni'");
        console.log('   Values updated');

        // Step 2: First drop the default value to release enum dependency
        console.log('Step 2: Dropping default value...');
        await sequelize.query("ALTER TABLE members ALTER COLUMN membership_type DROP DEFAULT");
        console.log('   Default value dropped');

        // Step 3: Change column to TEXT to release enum dependency
        console.log('Step 3: Changing column to TEXT...');
        await sequelize.query("ALTER TABLE members ALTER COLUMN membership_type TYPE TEXT");
        console.log('   Column changed to TEXT');

        // Step 4: Drop old enum type
        console.log('Step 4: Dropping old enum type...');
        await sequelize.query("DROP TYPE IF EXISTS enum_members_membership_type");
        console.log('   Old enum type dropped');

        // Step 5: Create new enum with lowercase values
        console.log('Step 5: Creating new enum with lowercase values...');
        await sequelize.query("CREATE TYPE \"enum_members_membership_type\" AS ENUM ('regular', 'student', 'staff', 'alumni', 'honorary')");
        console.log('   New enum created');

        // Step 6: Change column back to new enum type with default
        console.log('Step 6: Changing column to new enum type...');
        await sequelize.query("ALTER TABLE members ALTER COLUMN membership_type TYPE \"enum_members_membership_type\" USING membership_type::text::\"enum_members_membership_type\"");
        await sequelize.query("ALTER TABLE members ALTER COLUMN membership_type SET DEFAULT 'regular'");
        console.log('   Column changed to enum with default');

        // Verify final result
        console.log('\n=== Verification ===');
        const enumVals = await sequelize.query(
            "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_members_membership_type') ORDER BY enumsortorder",
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('Enum values:', JSON.stringify(enumVals, null, 2));

        const memberTypes = await sequelize.query(
            "SELECT DISTINCT membership_type FROM members",
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('Member types:', JSON.stringify(memberTypes, null, 2));

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

runMigration();
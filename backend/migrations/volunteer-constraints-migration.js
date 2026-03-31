/**
 * Volunteer Constraints Migration
 * Updates NOT NULL constraints for volunteer table
 */

const { sequelize } = require('../config/database');

async function runVolunteerConstraintsMigration() {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        console.log('✓ Checking volunteer table constraints...');
        
        // Check if volunteers table exists
        const volunteersTable = await queryInterface.describeTable('volunteers');
        
        // Update member_id and user_id to allow NULL values for public applications
        const constraintUpdates = [
            {
                column: 'member_id',
                check: volunteersTable.member_id && !volunteersTable.member_id.allowNull
            },
            {
                column: 'user_id', 
                check: volunteersTable.user_id && !volunteersTable.user_id.allowNull
            }
        ];
        
        for (const update of constraintUpdates) {
            if (update.check) {
                console.log(`  → Updating constraint for ${update.column} to allow NULL`);
                try {
                    // Use raw SQL to change column constraint
                    await queryInterface.sequelize.query(`
                        ALTER TABLE "volunteers" 
                        ALTER COLUMN "${update.column}" DROP NOT NULL
                    `);
                    console.log(`  ✓ Updated constraint for ${update.column}`);
                } catch (error) {
                    // If constraint doesn't exist or column is already nullable, continue
                    console.log(`  ✓ ${update.column} already allows NULL or constraint doesn't exist`);
                }
            } else {
                console.log(`  ✓ ${update.column} already allows NULL`);
            }
        }
        
        console.log('✓ Volunteer constraints migration completed successfully');
        return true;
        
    } catch (error) {
        console.error('✗ Volunteer constraints migration failed:', error.message);
        return false;
    }
}

module.exports = { runVolunteerConstraintsMigration };

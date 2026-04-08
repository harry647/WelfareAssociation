/**
 * Loan Table Migration
 * Adds missing columns to the loans table
 */

const { sequelize } = require('../config/database');

async function runLoanMigration() {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        console.log('✓ Checking loans table schema...');
        
        // Check if loans table exists
        let loansTable;
        try {
            loansTable = await queryInterface.describeTable('loans');
        } catch (error) {
            console.log('  → Loans table does not exist, skipping migration');
            return true;
        }
        
        // Define required columns for loans
        const loanMigrations = [
            { 
                column: 'guarantor_status', 
                spec: {
                    type: sequelize.Sequelize.ENUM('pending', 'accepted', 'rejected', 'not_required'),
                    defaultValue: 'pending',
                    allowNull: true
                }
            },
            { 
                column: 'guarantor_response_date', 
                spec: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: true
                }
            },
            { 
                column: 'guarantor_response_note', 
                spec: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: true
                }
            }
        ];
        
        // Add missing columns
        for (const migration of loanMigrations) {
            if (!loansTable[migration.column]) {
                console.log(`  → Adding missing column: loans.${migration.column}`);
                await queryInterface.addColumn('loans', migration.column, migration.spec);
                console.log(`  ✓ Column loans.${migration.column} added`);
            } else {
                console.log(`  ✓ Column loans.${migration.column} already exists`);
            }
        }
        
        console.log('✓ Loan table migration completed successfully');
        return true;
        
    } catch (error) {
        console.error('✗ Loan migration failed:', error.message);
        return false;
    }
}

module.exports = { runLoanMigration };

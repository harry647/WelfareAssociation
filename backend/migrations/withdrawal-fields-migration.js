/**
 * Withdrawal Fields Migration
 * Adds type, approved_by, and loan_id fields to withdrawals table
 */

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

async function runWithdrawalMigration() {
    try {
        console.log('🔄 Checking withdrawal fields...');
        
        const queryInterface = sequelize.getQueryInterface();
        
        // Check if withdrawals table exists
        let tableExists = false;
        try {
            await queryInterface.describeTable('withdrawals');
            tableExists = true;
        } catch (error) {
            console.log('  → Withdrawals table does not exist, skipping migration');
            return true;
        }
        
        const dialect = sequelize.getDialect();
        console.log(`📦 Database dialect: ${dialect}`);
        
        if (dialect === 'sqlite') {
            // SQLite: Add columns using raw SQL
            try {
                await sequelize.query(`
                    ALTER TABLE withdrawals ADD COLUMN type VARCHAR(50) DEFAULT 'other'
                `);
                console.log('✅ type column added to withdrawals');
            } catch (e) {
                if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
                    console.log('⚠️ type column already exists in withdrawals');
                } else {
                    console.log('⚠️ type column:', e.message);
                }
            }

            try {
                await sequelize.query(`
                    ALTER TABLE withdrawals ADD COLUMN approved_by VARCHAR(255)
                `);
                console.log('✅ approved_by column added to withdrawals');
            } catch (e) {
                if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
                    console.log('⚠️ approved_by column already exists in withdrawals');
                } else {
                    console.log('⚠️ approved_by column:', e.message);
                }
            }

            try {
                await sequelize.query(`
                    ALTER TABLE withdrawals ADD COLUMN loan_id VARCHAR(255)
                `);
                console.log('✅ loan_id column added to withdrawals');
            } catch (e) {
                if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
                    console.log('⚠️ loan_id column already exists in withdrawals');
                } else {
                    console.log('⚠️ loan_id column:', e.message);
                }
            }
        } else {
            // PostgreSQL: Use Sequelize query interface
            const queryInterface = sequelize.getQueryInterface();

            try {
                await queryInterface.addColumn('withdrawals', 'type', {
                    type: DataTypes.STRING(50),
                    defaultValue: 'other'
                });
                console.log('✅ type column added to withdrawals');
            } catch (e) {
                console.log('⚠️ type column:', e.message.includes('already exists') ? 'already exists' : e.message);
            }

            try {
                await queryInterface.addColumn('withdrawals', 'approved_by', {
                    type: DataTypes.UUID,
                    allowNull: true
                });
                console.log('✅ approved_by column added to withdrawals');
            } catch (e) {
                console.log('⚠️ approved_by column:', e.message.includes('already exists') ? 'already exists' : e.message);
            }

            try {
                await queryInterface.addColumn('withdrawals', 'loan_id', {
                    type: DataTypes.UUID,
                    allowNull: true
                });
                console.log('✅ loan_id column added to withdrawals');
            } catch (e) {
                console.log('⚠️ loan_id column:', e.message.includes('already exists') ? 'already exists' : e.message);
            }
        }

        console.log('✅ Withdrawal fields migration completed');
        return true;
    } catch (error) {
        console.error('❌ Withdrawal migration error:', error.message);
        return false;
    }
}

module.exports = { runWithdrawalMigration };

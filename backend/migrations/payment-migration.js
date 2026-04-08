/**
 * Payment Migration
 * Adds missing fields to Payment model for form compatibility
 */

const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = isProduction
    ? process.env.POSTGRES_URI_PROD
    : process.env.POSTGRES_URI_DEV || process.env.POSTGRES_URI;

const pool = new Pool({
    connectionString: connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

async function runPaymentMigration() {
    try {
        console.log('🔄 Running payment migration...');
        
        // Check if payments table exists
        const tableExists = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'payments'
        `);
        
        if (tableExists.rows.length === 0) {
            console.log('  → Payments table does not exist, skipping migration');
            return true;
        }

        // Get current table description
        const tableDescription = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'payments'
        `);
        
        const existingColumns = tableDescription.rows.map(col => col.column_name);
        
        console.log(`   Current columns: ${existingColumns.join(', ')}`);
        
        // Fields to add - based on Payment model
        const fieldsToAdd = [
            {
                name: 'student_id',
                type: 'VARCHAR(50)',
                allowNull: true,
                comment: 'Student ID for reference'
            },
            {
                name: 'full_name',
                type: 'VARCHAR(200)',
                allowNull: true,
                comment: 'Payer full name'
            },
            {
                name: 'phone',
                type: 'VARCHAR(20)',
                allowNull: true,
                comment: 'Payer phone number'
            },
            {
                name: 'account_reference',
                type: 'VARCHAR(100)',
                allowNull: true,
                comment: 'Account reference for M-Pesa'
            },
            {
                name: 'description',
                type: 'TEXT',
                allowNull: true,
                comment: 'Payment description'
            },
            {
                name: 'notes',
                type: 'TEXT',
                allowNull: true,
                comment: 'Additional payment notes'
            },
            {
                name: 'receipt',
                type: 'VARCHAR(500)',
                allowNull: true,
                comment: 'Receipt URL or path'
            }
        ];

        // Add missing fields
        for (const field of fieldsToAdd) {
            if (!existingColumns.includes(field.name)) {
                console.log(`➕ Adding field: ${field.name}`);
                await pool.query(`
                    ALTER TABLE payments 
                    ADD COLUMN ${field.name} ${field.type} ${field.allowNull ? '' : 'NOT NULL'}
                `);
            } else {
                console.log(`✅ Field already exists: ${field.name}`);
            }
        }

        // Add payment_number column with proper size if it exists but is too small
        const paymentNumCol = existingColumns.includes('payment_number');
        if (paymentNumCol) {
            // Check current column size
            const colInfo = await pool.query(`
                SELECT character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'payments' AND column_name = 'payment_number'
            `);
            const currentLen = colInfo.rows[0]?.character_maximum_length;
            if (currentLen && currentLen < 50) {
                console.log(`   Updating payment_number length from ${currentLen} to 50`);
                await pool.query(`
                    ALTER TABLE payments 
                    ALTER COLUMN payment_number TYPE VARCHAR(50)
                `);
            } else {
                console.log(`   payment_number length is ${currentLen || 'unlimited'}`);
            }
        }
        
        // Add missing enum values to enum_payments_type
        console.log('\n🔧 Adding missing enum values to payment type...');
        
        const valuesToAdd = [
            'shares',
            'welfare',
            'bereavement',
            'event',
            'registration',
            'subscription'
        ];
        
        // Get current enum values
        const currentEnumValues = await pool.query(`
            SELECT e.enumlabel 
            FROM pg_enum e 
            WHERE e.enumtypid = (SELECT t.oid FROM pg_type t WHERE t.typname = 'enum_payments_type')
        `);
        
        const existingEnumValues = currentEnumValues.rows.map(row => row.enumlabel);
        console.log(`   Current enum values: ${existingEnumValues.join(', ')}`);
        
        // Add missing values
        for (const value of valuesToAdd) {
            if (!existingEnumValues.includes(value)) {
                console.log(`➕ Adding enum value: ${value}`);
                await pool.query(`
                    ALTER TYPE "enum_payments_type" ADD VALUE '${value}'
                `);
            } else {
                console.log(`✅ Enum value already exists: ${value}`);
            }
        }
        
        // Verify final values
        const finalEnumValues = await pool.query(`
            SELECT e.enumlabel 
            FROM pg_enum e 
            WHERE e.enumtypid = (SELECT t.oid FROM pg_type t WHERE t.typname = 'enum_payments_type')
            ORDER BY e.enumlabel
        `);
        
        console.log(`   Final enum values: ${finalEnumValues.rows.map(row => row.enumlabel).join(', ')}`);
        
        console.log('✅ Payment migration completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Payment migration error:', error.message);
        return false;
    }
}

module.exports = { runPaymentMigration };

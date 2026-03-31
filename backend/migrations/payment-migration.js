/**
 * Payment Migration
 * Adds missing fields to Payment model for form compatibility
 */

const { sequelize } = require('../config/database');

async function runPaymentMigration() {
    try {
        console.log('🔄 Running payment migration...');
        
        // Check if payments table exists
        const tableExists = await sequelize.getQueryInterface().tableExists('payments');
        
        if (!tableExists) {
            console.log('❌ Payments table does not exist. Please run initial migration first.');
            return false;
        }

        // Get current table description
        const tableDescription = await sequelize.getQueryInterface().describeTable('payments');
        
        // Fields to add
        const fieldsToAdd = [
            {
                name: 'studentId',
                type: sequelize.QueryInterface.STRING(50),
                allowNull: true,
                comment: 'Student ID for reference'
            },
            {
                name: 'fullName',
                type: sequelize.QueryInterface.STRING(200),
                allowNull: true,
                comment: 'Payer full name'
            },
            {
                name: 'phone',
                type: sequelize.QueryInterface.STRING(20),
                allowNull: true,
                comment: 'Payer phone number'
            },
            {
                name: 'notes',
                type: sequelize.QueryInterface.TEXT,
                allowNull: true,
                comment: 'Additional payment notes'
            }
        ];

        // Add missing fields
        for (const field of fieldsToAdd) {
            if (!tableDescription[field.name]) {
                console.log(`➕ Adding field: ${field.name}`);
                await sequelize.getQueryInterface().addColumn(
                    'payments',
                    field.name,
                    {
                        type: field.type,
                        allowNull: field.allowNull,
                        comment: field.comment
                    }
                );
            } else {
                console.log(`✅ Field already exists: ${field.name}`);
            }
        }

        // Update type enum if needed
        if (tableDescription.type) {
            const currentEnum = tableDescription.type.type || '';
            const newEnumValues = ['loan_repayment', 'contribution', 'savings', 'fine', 'donation', 'shares', 'welfare', 'bereavement', 'event', 'registration', 'subscription', 'other'];
            
            // Check if we need to update the enum
            const needsEnumUpdate = newEnumValues.some(value => !currentEnum.includes(value));
            
            if (needsEnumUpdate) {
                console.log('🔄 Updating payment type enum...');
                await sequelize.getQueryInterface().changeColumn(
                    'payments',
                    'type',
                    {
                        type: sequelize.QueryInterface.ENUM(...newEnumValues),
                        allowNull: false
                    }
                );
            } else {
                console.log('✅ Payment type enum is up to date');
            }
        }

        console.log('✅ Payment migration completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Payment migration error:', error);
        return false;
    }
}

module.exports = { runPaymentMigration };

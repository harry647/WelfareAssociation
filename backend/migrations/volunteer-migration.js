/**
 * Volunteer Table Migration
 * Adds missing columns to the volunteers table to match the Volunteer model
 */

const { sequelize } = require('../config/database');

async function runVolunteerMigration() {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
        console.log('✓ Checking volunteers table schema...');
        
        // Check if volunteers table exists
        const volunteersTable = await queryInterface.describeTable('volunteers');
        
        // Define required columns based on Volunteer model
        const volunteerMigrations = [
            { 
                column: 'member_id', 
                spec: {
                    type: sequelize.Sequelize.UUID,
                    allowNull: true
                }
            },
            { 
                column: 'user_id', 
                spec: {
                    type: sequelize.Sequelize.UUID,
                    allowNull: true
                }
            },
            { 
                column: 'name', 
                spec: {
                    type: sequelize.Sequelize.STRING,
                    allowNull: true
                }
            },
            { 
                column: 'email', 
                spec: {
                    type: sequelize.Sequelize.STRING,
                    allowNull: true
                }
            },
            { 
                column: 'phone', 
                spec: {
                    type: sequelize.Sequelize.STRING,
                    allowNull: true
                }
            },
            { 
                column: 'student_id', 
                spec: {
                    type: sequelize.Sequelize.STRING,
                    allowNull: true
                }
            },
            { 
                column: 'year_of_study', 
                spec: {
                    type: sequelize.Sequelize.STRING,
                    allowNull: true
                }
            },
            { 
                column: 'area', 
                spec: {
                    type: sequelize.Sequelize.ENUM('events', 'education', 'community', 'fundraising', 'administration', 'other'),
                    allowNull: false
                }
            },
            { 
                column: 'skills', 
                spec: {
                    type: sequelize.Sequelize.ARRAY(sequelize.Sequelize.STRING),
                    defaultValue: []
                }
            },
            { 
                column: 'availability', 
                spec: {
                    type: sequelize.Sequelize.JSONB,
                    defaultValue: {}
                }
            },
            { 
                column: 'experience', 
                spec: {
                    type: sequelize.Sequelize.TEXT,
                    defaultValue: ''
                }
            },
            { 
                column: 'motivation', 
                spec: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: false
                }
            },
            { 
                column: 'status', 
                spec: {
                    type: sequelize.Sequelize.ENUM('pending', 'approved', 'rejected', 'active', 'inactive'),
                    defaultValue: 'pending'
                }
            },
            { 
                column: 'reviewed_by', 
                spec: {
                    type: sequelize.Sequelize.UUID,
                    allowNull: true
                }
            },
            { 
                column: 'reviewed_at', 
                spec: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: true
                }
            },
            { 
                column: 'rejection_reason', 
                spec: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: true
                }
            },
            { 
                column: 'hours_contributed', 
                spec: {
                    type: sequelize.Sequelize.INTEGER,
                    defaultValue: 0
                }
            },
            { 
                column: 'activities', 
                spec: {
                    type: sequelize.Sequelize.JSONB,
                    defaultValue: []
                }
            },
            { 
                column: 'notes', 
                spec: {
                    type: sequelize.Sequelize.JSONB,
                    defaultValue: []
                }
            }
        ];
        
        // Add missing columns
        for (const migration of volunteerMigrations) {
            if (!volunteersTable[migration.column]) {
                console.log(`  → Adding missing column: volunteers.${migration.column}`);
                await queryInterface.addColumn('volunteers', migration.column, migration.spec);
                console.log(`  ✓ Column volunteers.${migration.column} added`);
            } else {
                console.log(`  ✓ Column volunteers.${migration.column} already exists`);
            }
        }
        
        console.log('✓ Volunteer table migration completed successfully');
        return true;
        
    } catch (error) {
        console.error('✗ Volunteer migration failed:', error.message);
        return false;
    }
}

module.exports = { runVolunteerMigration };

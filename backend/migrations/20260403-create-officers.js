/**
 * Create Officers Table Migration
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const { DataTypes } = Sequelize;

        // Create officers table
        await queryInterface.createTable('officers', {
            id: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            member_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'members',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            position: {
                type: DataTypes.ENUM('chairman', 'vice-chairman', 'secretary', 'treasurer', 'pro', 'committee-head', 'member'),
                allowNull: false
            },
            role: {
                type: DataTypes.ENUM('admin', 'executive'),
                allowNull: false
            },
            department: {
                type: DataTypes.ENUM('finance', 'events', 'welfare', 'academic', 'sports', 'communications'),
                allowNull: true
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated'),
                defaultValue: 'active'
            },
            account_status: {
                type: DataTypes.ENUM('active', 'pending', 'suspended'),
                defaultValue: 'pending'
            },
            member_data_snapshot: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: {}
            },
            account_data: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {}
            },
            notifications: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {}
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            appointed_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            appointment_date: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Create indexes
        await queryInterface.addIndex('officers', ['member_id']);
        await queryInterface.addIndex('officers', ['user_id']);
        await queryInterface.addIndex('officers', ['position']);
        await queryInterface.addIndex('officers', ['role']);
        await queryInterface.addIndex('officers', ['status']);
        await queryInterface.addIndex('officers', ['start_date']);
        await queryInterface.addIndex('officers', ['appointed_by']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('officers');
    }
};

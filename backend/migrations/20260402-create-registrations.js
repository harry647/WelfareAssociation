'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('registrations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            member_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'members',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            registration_number: {
                type: Sequelize.STRING(30),
                allowNull: false,
                unique: true
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false
            },
            registration_type: {
                type: Sequelize.ENUM('new', 'renewal', 'late'),
                defaultValue: 'new'
            },
            academic_year: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            semester: {
                type: Sequelize.ENUM('first', 'second', 'third'),
                allowNull: true
            },
            payment_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            payment_reference: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'completed', 'verified', 'cancelled'),
                defaultValue: 'pending'
            },
            registration_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            expiry_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            recorded_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add indexes
        await queryInterface.addIndex('registrations', ['member_id']);
        await queryInterface.addIndex('registrations', ['status']);
        await queryInterface.addIndex('registrations', ['registration_number']);
        await queryInterface.addIndex('registrations', ['academic_year']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('registrations');
    }
};

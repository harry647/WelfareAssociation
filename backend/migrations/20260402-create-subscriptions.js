'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('subscriptions', {
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
            subscription_number: {
                type: Sequelize.STRING(30),
                allowNull: false,
                unique: true
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false
            },
            subscription_type: {
                type: Sequelize.ENUM('monthly', 'quarterly', 'annual', 'lifetime'),
                defaultValue: 'monthly'
            },
            plan: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            payment_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            last_payment_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            payment_reference: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'active', 'expired', 'cancelled', 'suspended'),
                defaultValue: 'pending'
            },
            start_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            auto_renew: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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
        await queryInterface.addIndex('subscriptions', ['member_id']);
        await queryInterface.addIndex('subscriptions', ['status']);
        await queryInterface.addIndex('subscriptions', ['subscription_number']);
        await queryInterface.addIndex('subscriptions', ['subscription_type']);
        await queryInterface.addIndex('subscriptions', ['end_date']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('subscriptions');
    }
};

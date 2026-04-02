'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('shares', {
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
            share_number: {
                type: Sequelize.STRING(30),
                allowNull: false,
                unique: true
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false
            },
            number_of_shares: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            share_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 100.00
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
                type: Sequelize.ENUM('pending', 'paid', 'active', 'transferred'),
                defaultValue: 'pending'
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
        await queryInterface.addIndex('shares', ['member_id']);
        await queryInterface.addIndex('shares', ['status']);
        await queryInterface.addIndex('shares', ['share_number']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('shares');
    }
};

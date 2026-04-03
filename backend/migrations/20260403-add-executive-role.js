/**
 * Add executive role to users table enum
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Update the enum type to include 'executive'
        await queryInterface.changeColumn('users', 'role', {
            type: Sequelize.ENUM('member', 'admin', 'executive', 'treasurer', 'secretary', 'chairman'),
            allowNull: false,
            defaultValue: 'member'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert the enum type back to original
        await queryInterface.changeColumn('users', 'role', {
            type: Sequelize.ENUM('member', 'admin', 'treasurer', 'secretary', 'chairman'),
            allowNull: false,
            defaultValue: 'member'
        });
    }
};

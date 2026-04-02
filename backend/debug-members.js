/**
 * Debug script to check members in database
 */

require('dotenv').config();

const { sequelize, User, Member } = require('./models');

async function debugMembers() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        console.log('\n=== All Members ===');
        const members = await Member.findAll({
            attributes: ['id', 'memberNumber', 'firstName', 'lastName', 'email', 'membershipStatus'],
            limit: 10
        });
        
        members.forEach(member => {
            console.log(`ID: ${member.id}`);
            console.log(`Name: ${member.firstName} ${member.lastName}`);
            console.log(`Email: ${member.email}`);
            console.log(`Member Number: ${member.memberNumber}`);
            console.log(`Status: ${member.membershipStatus}`);
            console.log('---');
        });

        console.log('\n=== Checking specific member ID with association ===');
        const specificMemberWithUser = await Member.findByPk('e25af6ef-4305-4461-bc2f-1623f7bef9e3', {
            include: [{
                model: User,
                as: 'user',
                attributes: ['email', 'role']
            }]
        });
        if (specificMemberWithUser) {
            console.log('Found specific member with user:', JSON.stringify(specificMemberWithUser.toJSON(), null, 2));
        } else {
            console.log('Member not found with ID: e25af6ef-4305-4461-bc2f-1623f7bef9e3');
        }

        console.log('\n=== Users ===');
        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'memberId'],
            limit: 5
        });
        
        users.forEach(user => {
            console.log(`User ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Member ID: ${user.memberId}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugMembers();

/**
 * Create Test Members Script
 * Creates a few test members to verify the member count functionality
 */

const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import sequelize from database config
const { sequelize } = require('../config/database');

// Import models
const User = require('../models/User');
const Member = require('../models/Member');

async function createTestMembers() {
    try {
        console.log('Creating test members...');

        // First, create a test user
        const testUser = await User.create({
            email: 'admin@test.com',
            password: await bcrypt.hash('test123', 10),
            role: 'admin',
            firstName: 'System',
            lastName: 'Administrator'
        });

        console.log('Created test user:', testUser.id);

        // Create test members
        const testMembers = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                phone: '+254712345678',
                membershipType: 'Student',
                membershipStatus: 'active'
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@test.com',
                phone: '+254723456789',
                membershipType: 'Student',
                membershipStatus: 'active'
            },
            {
                firstName: 'Bob',
                lastName: 'Wilson',
                email: 'bob.wilson@test.com',
                phone: '+254734567890',
                membershipType: 'Alumni',
                membershipStatus: 'active'
            }
        ];

        for (const memberData of testMembers) {
            const member = await Member.create({
                userId: testUser.id,
                memberNumber: `TEST/${Math.floor(Math.random() * 1000)}`,
                ...memberData
            });
            console.log('Created member:', member.id);
        }

        console.log('Test members created successfully!');
        console.log('Total members created:', testMembers.length);
        
    } catch (error) {
        console.error('Error creating test members:', error);
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    createTestMembers();
}

module.exports = { createTestMembers };

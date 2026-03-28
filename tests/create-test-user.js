require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./backend/models');

async function createTestMember() {
  try {
    // Delete existing test user if any
    await User.destroy({ where: { email: 'testmember@swa.org' }, force: true });
    console.log('Cleaned up existing user');
    
    // Create a test member user
    const testUser = await User.create({
      email: 'testmember@swa.org',
      password: await bcrypt.hash('TestPass123!', 10),
      firstName: 'Test',
      lastName: 'Member',
      phone: '+254700000001',
      role: 'member',
      isEmailVerified: true,
      isActive: true
    });
    
    console.log('Test user created:', testUser.id);
    
    // Create the member record using direct SQL
    await sequelize.query(`
      INSERT INTO members (id, user_id, member_number, first_name, last_name, email, phone, membership_type, membership_status, created_at, updated_at)
      VALUES (gen_random_uuid(), '${testUser.id}', 'MEM001', 'Test', 'Member', 'testmember@swa.org', '+254700000001', 'student', 'active', NOW(), NOW())
    `);
    
    console.log('Test member created successfully!');
    console.log('Login with: testmember@swa.org / TestPass123!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestMember();
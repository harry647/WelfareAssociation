require('dotenv').config();
const { sequelize } = require('./backend/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdminUser() {
  try {
    const hash = bcrypt.hashSync('SWAAdmin2024!', 10);
    const adminId = uuidv4(); // Generate a valid UUID
    
    await sequelize.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role, is_active, is_email_verified, created_at, updated_at) 
      VALUES ('${adminId}', 'admin@swa.org', '${hash}', 'Admin', 'User', 'admin', true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password = '${hash}', role = 'admin'
    `);
    
    console.log('Admin user created/updated successfully!');
    console.log('Admin ID:', adminId);
    
    // Verify the user
    const result = await sequelize.query(
      "SELECT id, email, role FROM users WHERE role = 'admin'",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Admin users in database:', result);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
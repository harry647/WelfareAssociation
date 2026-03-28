require('dotenv').config();
const { sequelize } = require('./backend/config/database');

async function createAdminMember() {
  try {
    const adminUserId = '867a9256-0217-43af-ad49-00a40a133751';
    
    // Check if member already exists
    const existingMember = await sequelize.query(
      `SELECT * FROM members WHERE user_id = '${adminUserId}'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (existingMember.length > 0) {
      console.log('Admin member already exists:', existingMember);
      return;
    }
    
    // Create member record for admin
    const memberId = sequelize.query(
      `INSERT INTO members (id, user_id, member_number, first_name, last_name, email, phone, membership_type, membership_status, created_at, updated_at)
       VALUES (gen_random_uuid(), '${adminUserId}', 'ADMIN001', 'Admin', 'User', 'admin@swa.org', '+254700000000', 'staff', 'active', NOW(), NOW())
       RETURNING id`,
      { type: sequelize.QueryTypes.INSERT }
    );
    
    const result = await sequelize.query(
      `SELECT * FROM members WHERE user_id = '${adminUserId}'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Admin member created!', result);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAdminMember();
const { sequelize } = require('./config/database');
const { Member } = require('./models');

async function checkDatabaseSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');
        
        // Get the actual table structure
        const tableInfo = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'members' 
            ORDER BY ordinal_position
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('\n=== MEMBERS TABLE STRUCTURE ===');
        tableInfo[0].forEach(column => {
            console.log(`Column: ${column.column_name}`);
            console.log(`  Type: ${column.data_type}`);
            console.log(`  Nullable: ${column.is_nullable}`);
            console.log(`  Default: ${column.column_default}`);
            console.log('---');
        });
        
        // Get a sample member to see actual data
        const sampleMember = await Member.findOne({
            attributes: ['id', 'firstName', 'lastName', 'memberNumber', 'phone', 'email', 
                     'gender', 'membershipStatus', 'joinDate', 'dateOfBirth',
                     'institution', 'emergencyContact']
        });
        
        if (sampleMember) {
            console.log('\n=== SAMPLE MEMBER DATA ===');
            console.log('Raw data:', JSON.stringify(sampleMember.dataValues, null, 2));
            console.log('Institution:', JSON.stringify(sampleMember.institution, null, 2));
            console.log('Emergency Contact:', JSON.stringify(sampleMember.emergencyContact, null, 2));
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkDatabaseSchema();

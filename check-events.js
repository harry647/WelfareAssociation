/**
 * Check Events in Database
 */

require('dotenv').config();
const { sequelize } = require('./backend/config/database');
const Event = require('./backend/models/Event');

async function checkEvents() {
    console.log('🔍 Checking events in database...');
    
    try {
        const events = await Event.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`📊 Found ${events.length} events in database:`);
        
        events.forEach((event, index) => {
            console.log(`${index + 1}. ${event.title} (${event.type}) - ${event.status}`);
            console.log(`   Date: ${event.eventDate}`);
            console.log(`   Location: ${JSON.stringify(event.location)}`);
            console.log(`   Requires Registration: ${event.requiresRegistration}`);
            console.log(`   Max Attendees: ${event.maxAttendees || 'Unlimited'}`);
            console.log(`   Organizer: ${event.organizer || 'None'}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('❌ Error checking events:', error);
    } finally {
        await sequelize.close();
    }
}

// Run the check
checkEvents();

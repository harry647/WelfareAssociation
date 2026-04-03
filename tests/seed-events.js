/**
 * Seed Events Script
 * Creates sample events for testing
 */

require('dotenv').config();
const { sequelize } = require('./backend/config/database');
const Event = require('./backend/models/Event');

async function seedEvents() {
    console.log('🌱 Seeding events...');
    
    try {
        // Sample events
        const events = [
            {
                title: 'Orientation Day',
                description: 'Welcome orientation for new students',
                eventDate: new Date('2026-04-15'),
                endDate: new Date('2026-04-15'),
                location: { venue: 'Main Campus Hall', address: 'JOOUST Main Campus' },
                type: 'meeting',
                requiresRegistration: true,
                maxAttendees: 200,
                status: 'published'
            },
            {
                title: 'Career Fair',
                description: 'Annual career fair with employer networking',
                eventDate: new Date('2026-05-20'),
                endDate: new Date('2026-05-20'),
                location: { venue: 'University Grounds', address: 'JOOUST Sports Field' },
                type: 'workshop',
                requiresRegistration: true,
                maxAttendees: 500,
                status: 'published'
            },
            {
                title: 'Sports Day',
                description: 'Inter-department sports competition',
                eventDate: new Date('2026-06-10'),
                endDate: new Date('2026-06-10'),
                location: { venue: 'Sports Complex', address: 'JOOUST Sports Complex' },
                type: 'sports',
                requiresRegistration: true,
                maxAttendees: 300,
                status: 'published'
            }
        ];
        
        // Insert events
        for (const eventData of events) {
            try {
                const event = await Event.create(eventData);
                console.log(`✅ Created event: ${event.title}`);
            } catch (error) {
                console.error(`❌ Failed to create event ${eventData.title}:`, error.message);
            }
        }
        
        console.log('🎉 Events seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding events:', error);
    } finally {
        await sequelize.close();
    }
}

// Run the seeding
seedEvents();

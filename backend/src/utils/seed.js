const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedCategories = async () => {
  try {
    // 1. Seed Categories
    const catCount = await prisma.category.count();
    let categoriesInDb = [];
    if (catCount === 0) {
      console.log('🌱 Database has no categories. Seeding categories...');
      const categories = [
        { name: 'Music', description: 'Concerts, beach parties, jazz sessions' },
        { name: 'Food', description: 'Swahili street food, dining, food festivals' },
        { name: 'Sports', description: 'Marathons, football, water sports, yoga' },
        { name: 'Culture', description: 'Museum tours, heritage galas, historical storytelling' },
        { name: 'Tech', description: 'Conferences, bootcamps, developer hackathons' },
        { name: 'Nightlife', description: 'Clubs, lounges, late night shows' },
      ];
      await prisma.category.createMany({ data: categories });
      console.log('✅ Categories seeded.');
      categoriesInDb = await prisma.category.findMany();
    } else {
      categoriesInDb = await prisma.category.findMany();
    }

    // 2. Seed Users if not present
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create or find Admin
    let adminInDb = await prisma.user.findUnique({ where: { email: 'admin@hafla.com' } });
    if (!adminInDb) {
      console.log('🌱 Admin user not found. Seeding admin@hafla.com...');
      adminInDb = await prisma.user.create({
        data: {
          fullName: 'Hafla Admin',
          email: 'admin@hafla.com',
          hashedPassword,
          role: 'ADMIN',
          verified: true
        }
      });
    }

    // Create or find Organizer
    let organizerInDb = await prisma.user.findUnique({ where: { email: 'organizer@hafla.com' } });
    if (!organizerInDb) {
      console.log('🌱 Organizer user not found. Seeding organizer@hafla.com...');
      organizerInDb = await prisma.user.create({
        data: {
          fullName: 'Coastal Events Ltd',
          email: 'organizer@hafla.com',
          hashedPassword,
          role: 'ORGANIZER',
          verified: true
        }
      });
    }

    // Create or find Attendee
    let attendeeInDb = await prisma.user.findUnique({ where: { email: 'attendee@hafla.com' } });
    if (!attendeeInDb) {
      console.log('🌱 Attendee user not found. Seeding attendee@hafla.com...');
      attendeeInDb = await prisma.user.create({
        data: {
          fullName: 'Alvin Kyalo',
          email: 'attendee@hafla.com',
          hashedPassword,
          role: 'ATTENDEE',
          verified: true,
          phone: '+254712345678'
        }
      });
    }

    // 3. Seed Events and Tickets if not present
    if (organizerInDb) {
      const catMap = {};
      categoriesInDb.forEach(c => { catMap[c.name] = c.id; });

      const eventsData = [
        {
          title: 'Coastal Vibes Beach Party',
          venue: 'Nyali Beachfront, Mombasa',
          description: 'Experience the ultimate beach party on the shores of Nyali! Good music, great vibes, Swahili dishes, and night-long fun.',
          eventDate: new Date('2025-10-24T20:00:00Z'),
          eventTime: '8:00 PM',
          ticketPrice: 2500,
          capacity: 500,
          bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
          categoryId: catMap['Music'] || categoriesInDb[0].id,
          organiserId: organizerInDb.id,
          status: 'APPROVED'
        },
        {
          title: 'Old Town Architecture Walk',
          venue: 'Fort Jesus, Old Town',
          description: 'A guided historical tour of Fort Jesus and the narrow streets of Mombasa Old Town. Hear tales of the Portuguese and Arab eras.',
          eventDate: new Date('2025-10-25T09:00:00Z'),
          eventTime: '9:00 AM',
          ticketPrice: 0,
          capacity: 50,
          bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
          categoryId: catMap['Culture'] || categoriesInDb[0].id,
          organiserId: organizerInDb.id,
          status: 'APPROVED'
        },
        {
          title: 'Dev Summit Mombasa',
          venue: 'Swahilipot Hub',
          description: 'Join top tech talent, developers, and designers at Swahilipot Hub for talks, workshops, and networking events.',
          eventDate: new Date('2025-11-01T10:00:00Z'),
          eventTime: '10:00 AM',
          ticketPrice: 1000,
          capacity: 200,
          bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
          categoryId: catMap['Tech'] || categoriesInDb[0].id,
          organiserId: organizerInDb.id,
          status: 'APPROVED'
        },
        {
          title: 'Swahili Food Festival',
          venue: 'Haller Park',
          description: 'Sample the richest coastal cuisines - Biryani, Pilau, Mahamri, Mshikaki, and fresh seafood from top local chefs.',
          eventDate: new Date('2025-11-16T12:00:00Z'),
          eventTime: '12:00 PM',
          ticketPrice: 1500,
          capacity: 300,
          bannerUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
          categoryId: catMap['Food'] || categoriesInDb[0].id,
          organiserId: organizerInDb.id,
          status: 'APPROVED'
        }
      ];

      for (const ev of eventsData) {
        const existingEvent = await prisma.event.findFirst({ where: { title: ev.title } });
        if (!existingEvent) {
          console.log(`🌱 Seeding event: ${ev.title}...`);
          const createdEvent = await prisma.event.create({ data: ev });
          // Create ticket tier for the event
          await prisma.ticket.create({
            data: {
              eventId: createdEvent.id,
              ticketType: 'REGULAR',
              price: ev.ticketPrice,
              quantityAvailable: ev.capacity,
              status: 'CONFIRMED'
            }
          });
        }
      }
      console.log('✅ Events and tickets verification completed.');
    }
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
  }
};

module.exports = { seedCategories };


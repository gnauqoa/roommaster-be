import { PrismaClient } from '@prisma/client';

/**
 * Seed room types data
 * @param prisma - Prisma client instance
 */
export const seedRoomTypes = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding room types...');

  const roomTypes = [
    {
      name: 'Phòng Standard',
      capacity: 2,
      pricePerNight: 500000,
      amenities: {
        wifi: true,
        airConditioner: true,
        tv: true,
        minibar: false,
        balcony: false,
        bathroom: 'private'
      }
    },
    {
      name: 'Phòng Deluxe',
      capacity: 2,
      pricePerNight: 800000,
      amenities: {
        wifi: true,
        airConditioner: true,
        tv: true,
        minibar: true,
        balcony: false,
        bathroom: 'private',
        bathtub: true
      }
    },
    {
      name: 'Phòng Superior',
      capacity: 3,
      pricePerNight: 1200000,
      amenities: {
        wifi: true,
        airConditioner: true,
        tv: true,
        minibar: true,
        balcony: true,
        bathroom: 'private',
        bathtub: true,
        cityView: true
      }
    },
    {
      name: 'Phòng Suite',
      capacity: 4,
      pricePerNight: 2000000,
      amenities: {
        wifi: true,
        airConditioner: true,
        tv: true,
        minibar: true,
        balcony: true,
        bathroom: 'private',
        bathtub: true,
        jacuzzi: true,
        livingRoom: true,
        cityView: true
      }
    },
    {
      name: 'Phòng Family',
      capacity: 6,
      pricePerNight: 1800000,
      amenities: {
        wifi: true,
        airConditioner: true,
        tv: true,
        minibar: true,
        balcony: true,
        bathroom: 'private',
        extraBeds: 2,
        kitchenette: true
      }
    }
  ];

  const createdRoomTypes: { id: string; name: string }[] = [];

  for (const roomType of roomTypes) {
    const created = await prisma.roomType.upsert({
      where: {
        id: `seed_${roomType.name.toLowerCase().replace(/\s+/g, '_')}`
      },
      update: {
        name: roomType.name,
        capacity: roomType.capacity,
        pricePerNight: roomType.pricePerNight,
        amenities: roomType.amenities
      },
      create: {
        id: `seed_${roomType.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: roomType.name,
        capacity: roomType.capacity,
        pricePerNight: roomType.pricePerNight,
        amenities: roomType.amenities
      }
    });
    createdRoomTypes.push({ id: created.id, name: created.name });
  }

  console.log(`✓ Created ${roomTypes.length} room types`);

  return;
};

/**
 * Get seeded room types for use in other seeds
 */
export const getSeededRoomTypes = async (prisma: PrismaClient) => {
  return prisma.roomType.findMany({
    where: {
      id: {
        startsWith: 'seed_'
      }
    }
  });
};

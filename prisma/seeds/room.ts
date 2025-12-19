import prisma from '../../src/prisma';
import { RoomStatus } from '@prisma/client';

export const seedRoomTypes = async () => {
  console.log('🏨 Seeding room types...');

  const roomTypes = [
    {
      code: 'STD',
      name: 'Standard Room',
      baseCapacity: 2,
      maxCapacity: 3,
      rackRate: 800000,
      extraPersonFee: 200000,
      amenities: 'Air conditioning, TV, WiFi, Mini fridge',
      description: 'Comfortable standard room with basic amenities'
    },
    {
      code: 'SUP',
      name: 'Superior Room',
      baseCapacity: 2,
      maxCapacity: 4,
      rackRate: 1200000,
      extraPersonFee: 300000,
      amenities: 'Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view',
      description: 'Enhanced comfort with better amenities and city view'
    },
    {
      code: 'DLX',
      name: 'Deluxe Room',
      baseCapacity: 2,
      maxCapacity: 4,
      rackRate: 1800000,
      extraPersonFee: 400000,
      amenities: 'Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view',
      description: 'Luxurious room with premium amenities and ocean view'
    },
    {
      code: 'SUI',
      name: 'Suite',
      baseCapacity: 2,
      maxCapacity: 5,
      rackRate: 3000000,
      extraPersonFee: 500000,
      amenities:
        'Separate living room, Smart TV, WiFi, Full mini bar, Coffee maker, Bathtub, Balcony, Ocean view',
      description: 'Spacious suite with separate living area and panoramic views'
    },
    {
      code: 'FAM',
      name: 'Family Room',
      baseCapacity: 4,
      maxCapacity: 6,
      rackRate: 2500000,
      extraPersonFee: 400000,
      amenities: 'Connecting rooms, 2 bathrooms, Smart TV, WiFi, Mini bar, Coffee maker',
      description: 'Perfect for families with connecting rooms and extra space'
    }
  ];

  for (const roomType of roomTypes) {
    await prisma.roomType.upsert({
      where: { code: roomType.code },
      update: {},
      create: roomType
    });
  }

  console.log('✅ Room types seeded successfully!');
};

export const seedRooms = async () => {
  console.log('🚪 Seeding rooms...');

  const standardType = await prisma.roomType.findUnique({ where: { code: 'STD' } });
  const superiorType = await prisma.roomType.findUnique({ where: { code: 'SUP' } });
  const deluxeType = await prisma.roomType.findUnique({ where: { code: 'DLX' } });
  const suiteType = await prisma.roomType.findUnique({ where: { code: 'SUI' } });
  const familyType = await prisma.roomType.findUnique({ where: { code: 'FAM' } });

  if (!standardType || !superiorType || !deluxeType || !suiteType || !familyType) {
    throw new Error('Room types must be seeded first!');
  }

  const rooms = [
    // Floor 1 - Standard Rooms
    {
      code: '101',
      name: 'Room 101',
      floor: 1,
      roomTypeId: standardType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '102',
      name: 'Room 102',
      floor: 1,
      roomTypeId: standardType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '103',
      name: 'Room 103',
      floor: 1,
      roomTypeId: standardType.id,
      status: RoomStatus.OCCUPIED
    },
    {
      code: '104',
      name: 'Room 104',
      floor: 1,
      roomTypeId: standardType.id,
      status: RoomStatus.AVAILABLE
    },

    // Floor 2 - Superior Rooms
    {
      code: '201',
      name: 'Room 201',
      floor: 2,
      roomTypeId: superiorType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '202',
      name: 'Room 202',
      floor: 2,
      roomTypeId: superiorType.id,
      status: RoomStatus.RESERVED
    },
    {
      code: '203',
      name: 'Room 203',
      floor: 2,
      roomTypeId: superiorType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '204',
      name: 'Room 204',
      floor: 2,
      roomTypeId: superiorType.id,
      status: RoomStatus.OCCUPIED
    },
    {
      code: '205',
      name: 'Room 205',
      floor: 2,
      roomTypeId: superiorType.id,
      status: RoomStatus.AVAILABLE
    },

    // Floor 3 - Deluxe Rooms
    {
      code: '301',
      name: 'Room 301',
      floor: 3,
      roomTypeId: deluxeType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '302',
      name: 'Room 302',
      floor: 3,
      roomTypeId: deluxeType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '303',
      name: 'Room 303',
      floor: 3,
      roomTypeId: deluxeType.id,
      status: RoomStatus.OCCUPIED
    },
    {
      code: '304',
      name: 'Room 304',
      floor: 3,
      roomTypeId: deluxeType.id,
      status: RoomStatus.AVAILABLE
    },

    // Floor 4 - Family & Suite Rooms
    {
      code: '401',
      name: 'Suite 401',
      floor: 4,
      roomTypeId: suiteType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '402',
      name: 'Suite 402',
      floor: 4,
      roomTypeId: suiteType.id,
      status: RoomStatus.OCCUPIED
    },
    {
      code: '403',
      name: 'Family Room 403',
      floor: 4,
      roomTypeId: familyType.id,
      status: RoomStatus.AVAILABLE
    },
    {
      code: '404',
      name: 'Family Room 404',
      floor: 4,
      roomTypeId: familyType.id,
      status: RoomStatus.RESERVED
    },

    // Maintenance room example
    {
      code: '105',
      name: 'Room 105 (Maintenance)',
      floor: 1,
      roomTypeId: standardType.id,
      status: RoomStatus.MAINTENANCE,
      notes: 'AC unit replacement'
    }
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { code: room.code },
      update: {},
      create: room
    });
  }

  console.log('✅ Rooms seeded successfully!');
};

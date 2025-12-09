import prisma from '../../src/prisma';
import { RoomStatus } from '@prisma/client';

export const seedRoomTypes = async () => {
  console.log('🏠 Seeding room types...');

  const roomTypes = [
    {
      code: 'STD',
      name: 'Standard Room',
      baseCapacity: 2,
      maxCapacity: 3,
      amenities: 'AC, TV, WiFi, Mini Fridge',
      rackRate: 800000,
      extraPersonFee: 150000,
      description: 'Comfortable standard room with basic amenities'
    },
    {
      code: 'SUP',
      name: 'Superior Room',
      baseCapacity: 2,
      maxCapacity: 4,
      amenities: 'AC, TV, WiFi, Mini Fridge, Safe, Work Desk',
      rackRate: 1200000,
      extraPersonFee: 200000,
      description: 'Spacious room with enhanced amenities and city view'
    },
    {
      code: 'DLX',
      name: 'Deluxe Room',
      baseCapacity: 2,
      maxCapacity: 4,
      amenities: 'AC, TV, WiFi, Minibar, Safe, Work Desk, Bathtub',
      rackRate: 1800000,
      extraPersonFee: 250000,
      description: 'Luxurious room with premium amenities and balcony'
    },
    {
      code: 'SUI',
      name: 'Suite',
      baseCapacity: 2,
      maxCapacity: 6,
      amenities: 'AC, TV, WiFi, Full Minibar, Safe, Living Area, Jacuzzi, Kitchen',
      rackRate: 3500000,
      extraPersonFee: 300000,
      description: 'Executive suite with separate living area and premium facilities'
    },
    {
      code: 'FAM',
      name: 'Family Room',
      baseCapacity: 4,
      maxCapacity: 6,
      amenities: 'AC, TV, WiFi, Mini Fridge, Kids Corner, Extra Beds',
      rackRate: 2200000,
      extraPersonFee: 200000,
      description: 'Perfect for families with children, extra space and amenities'
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
  console.log('🛏️ Seeding rooms...');

  // Get room types
  const roomTypes = await prisma.roomType.findMany();
  const roomTypeMap = new Map(roomTypes.map((rt) => [rt.code, rt.id]));

  const rooms = [
    // Floor 1 - Standard rooms
    { code: '101', name: 'Room 101', floor: 1, roomTypeCode: 'STD', status: RoomStatus.AVAILABLE },
    { code: '102', name: 'Room 102', floor: 1, roomTypeCode: 'STD', status: RoomStatus.AVAILABLE },
    { code: '103', name: 'Room 103', floor: 1, roomTypeCode: 'STD', status: RoomStatus.AVAILABLE },
    { code: '104', name: 'Room 104', floor: 1, roomTypeCode: 'STD', status: RoomStatus.AVAILABLE },
    { code: '105', name: 'Room 105', floor: 1, roomTypeCode: 'SUP', status: RoomStatus.AVAILABLE },

    // Floor 2 - Superior and Deluxe rooms
    { code: '201', name: 'Room 201', floor: 2, roomTypeCode: 'SUP', status: RoomStatus.AVAILABLE },
    { code: '202', name: 'Room 202', floor: 2, roomTypeCode: 'SUP', status: RoomStatus.AVAILABLE },
    { code: '203', name: 'Room 203', floor: 2, roomTypeCode: 'DLX', status: RoomStatus.AVAILABLE },
    { code: '204', name: 'Room 204', floor: 2, roomTypeCode: 'DLX', status: RoomStatus.AVAILABLE },
    { code: '205', name: 'Room 205', floor: 2, roomTypeCode: 'FAM', status: RoomStatus.AVAILABLE },

    // Floor 3 - Deluxe and Suite
    { code: '301', name: 'Room 301', floor: 3, roomTypeCode: 'DLX', status: RoomStatus.AVAILABLE },
    { code: '302', name: 'Room 302', floor: 3, roomTypeCode: 'DLX', status: RoomStatus.AVAILABLE },
    { code: '303', name: 'Room 303', floor: 3, roomTypeCode: 'SUI', status: RoomStatus.AVAILABLE },
    { code: '304', name: 'Room 304', floor: 3, roomTypeCode: 'SUI', status: RoomStatus.AVAILABLE },
    { code: '305', name: 'Room 305', floor: 3, roomTypeCode: 'FAM', status: RoomStatus.AVAILABLE }
  ];

  for (const room of rooms) {
    const roomTypeId = roomTypeMap.get(room.roomTypeCode);
    if (roomTypeId) {
      await prisma.room.upsert({
        where: { code: room.code },
        update: {},
        create: {
          code: room.code,
          name: room.name,
          floor: room.floor,
          roomTypeId,
          status: room.status
        }
      });
    }
  }

  console.log('✅ Rooms seeded successfully!');
};

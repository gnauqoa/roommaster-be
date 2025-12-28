import { PrismaClient, RoomStatus } from '@prisma/client';
import { getSeededRoomTypes } from './roomType.seed';

/**
 * Seed rooms data
 * @param prisma - Prisma client instance
 */
export const seedRooms = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding rooms...');

  const roomTypes = await getSeededRoomTypes(prisma);

  if (roomTypes.length === 0) {
    console.log('⚠ No room types found. Please seed room types first.');
    return;
  }

  // Create a map of room type names to IDs
  const roomTypeMap = new Map(roomTypes.map((rt) => [rt.name, rt.id]));

  const rooms = [
    // Floor 1 - Standard rooms
    { roomNumber: '101', floor: 1, roomType: 'Phòng Standard', status: RoomStatus.AVAILABLE },
    { roomNumber: '102', floor: 1, roomType: 'Phòng Standard', status: RoomStatus.AVAILABLE },
    { roomNumber: '103', floor: 1, roomType: 'Phòng Standard', status: RoomStatus.AVAILABLE },
    { roomNumber: '104', floor: 1, roomType: 'Phòng Deluxe', status: RoomStatus.AVAILABLE },
    { roomNumber: '105', floor: 1, roomType: 'Phòng Deluxe', status: RoomStatus.AVAILABLE },

    // Floor 2 - Deluxe and Superior rooms
    { roomNumber: '201', floor: 2, roomType: 'Phòng Deluxe', status: RoomStatus.AVAILABLE },
    { roomNumber: '202', floor: 2, roomType: 'Phòng Deluxe', status: RoomStatus.AVAILABLE },
    { roomNumber: '203', floor: 2, roomType: 'Phòng Superior', status: RoomStatus.AVAILABLE },
    { roomNumber: '204', floor: 2, roomType: 'Phòng Superior', status: RoomStatus.AVAILABLE },
    { roomNumber: '205', floor: 2, roomType: 'Phòng Superior', status: RoomStatus.MAINTENANCE },

    // Floor 3 - Suite and Family rooms
    { roomNumber: '301', floor: 3, roomType: 'Phòng Suite', status: RoomStatus.AVAILABLE },
    { roomNumber: '302', floor: 3, roomType: 'Phòng Suite', status: RoomStatus.AVAILABLE },
    { roomNumber: '303', floor: 3, roomType: 'Phòng Family', status: RoomStatus.AVAILABLE },
    { roomNumber: '304', floor: 3, roomType: 'Phòng Family', status: RoomStatus.AVAILABLE },
    { roomNumber: '305', floor: 3, roomType: 'Phòng Family', status: RoomStatus.CLEANING }
  ];

  let createdCount = 0;

  for (const room of rooms) {
    const roomTypeId = roomTypeMap.get(room.roomType);
    if (!roomTypeId) {
      console.log(`⚠ Room type "${room.roomType}" not found for room ${room.roomNumber}`);
      continue;
    }

    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {
        floor: room.floor,
        roomTypeId: roomTypeId,
        status: room.status
      },
      create: {
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomTypeId: roomTypeId,
        status: room.status
      }
    });
    createdCount++;
  }

  console.log(`✓ Created ${createdCount} rooms`);
};

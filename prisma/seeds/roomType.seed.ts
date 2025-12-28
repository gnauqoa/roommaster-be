import { PrismaClient } from '@prisma/client';

/**
 * Seed room tags data
 * @param prisma - Prisma client instance
 */
export const seedRoomTags = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding room tags...');

  const tags = [
    { name: 'WiFi', description: 'Kết nối internet không dây miễn phí' },
    { name: 'Điều hòa', description: 'Máy lạnh điều hòa nhiệt độ' },
    { name: 'Tivi', description: 'Tivi màn hình phẳng' },
    { name: 'Minibar', description: 'Tủ lạnh mini với đồ uống' },
    { name: 'Ban công', description: 'Ban công riêng' },
    { name: 'Bồn tắm', description: 'Bồn tắm nằm' },
    { name: 'Jacuzzi', description: 'Bồn tắm massage' },
    { name: 'View thành phố', description: 'Tầm nhìn ra thành phố' },
    { name: 'Phòng khách', description: 'Khu vực phòng khách riêng' },
    { name: 'Bếp nhỏ', description: 'Khu vực nấu ăn nhỏ' }
  ];

  for (const tag of tags) {
    await prisma.roomTag.upsert({
      where: { name: tag.name },
      update: { description: tag.description },
      create: tag
    });
  }

  console.log(`✓ Created ${tags.length} room tags`);
};

/**
 * Seed room types data
 * @param prisma - Prisma client instance
 */
export const seedRoomTypes = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding room types...');

  // Ensure tags exist first
  await seedRoomTags(prisma);

  // Get all tags for mapping
  const allTags = await prisma.roomTag.findMany();
  const tagMap = new Map(allTags.map((t) => [t.name, t.id]));

  const roomTypes = [
    {
      name: 'Phòng Standard',
      capacity: 2,
      totalBed: 1,
      pricePerNight: 500000,
      tags: ['WiFi', 'Điều hòa', 'Tivi']
    },
    {
      name: 'Phòng Deluxe',
      capacity: 2,
      totalBed: 1,
      pricePerNight: 800000,
      tags: ['WiFi', 'Điều hòa', 'Tivi', 'Minibar', 'Bồn tắm']
    },
    {
      name: 'Phòng Superior',
      capacity: 3,
      totalBed: 2,
      pricePerNight: 1200000,
      tags: ['WiFi', 'Điều hòa', 'Tivi', 'Minibar', 'Ban công', 'Bồn tắm', 'View thành phố']
    },
    {
      name: 'Phòng Suite',
      capacity: 4,
      totalBed: 2,
      pricePerNight: 2000000,
      tags: [
        'WiFi',
        'Điều hòa',
        'Tivi',
        'Minibar',
        'Ban công',
        'Bồn tắm',
        'Jacuzzi',
        'Phòng khách',
        'View thành phố'
      ]
    },
    {
      name: 'Phòng Family',
      capacity: 6,
      totalBed: 3,
      pricePerNight: 1800000,
      tags: ['WiFi', 'Điều hòa', 'Tivi', 'Minibar', 'Ban công', 'Bếp nhỏ']
    }
  ];

  const createdRoomTypes: { id: string; name: string }[] = [];

  for (const roomType of roomTypes) {
    const roomTypeId = `seed_${roomType.name.toLowerCase().replace(/\s+/g, '_')}`;

    // Delete existing room type tags if updating
    await prisma.roomTypeTag.deleteMany({
      where: { roomTypeId }
    });

    const created = await prisma.roomType.upsert({
      where: { id: roomTypeId },
      update: {
        name: roomType.name,
        capacity: roomType.capacity,
        totalBed: roomType.totalBed,
        pricePerNight: roomType.pricePerNight
      },
      create: {
        id: roomTypeId,
        name: roomType.name,
        capacity: roomType.capacity,
        totalBed: roomType.totalBed,
        pricePerNight: roomType.pricePerNight
      }
    });

    // Create room type tags
    for (const tagName of roomType.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await prisma.roomTypeTag.create({
          data: {
            name: `${roomType.name}-${tagName}`,
            roomTypeId: created.id,
            roomTagId: tagId
          }
        });
      }
    }

    createdRoomTypes.push({ id: created.id, name: created.name });
  }

  console.log(`✓ Created ${roomTypes.length} room types with tags`);

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
    },
    include: {
      roomTypeTags: {
        include: {
          roomTag: true
        }
      }
    }
  });
};

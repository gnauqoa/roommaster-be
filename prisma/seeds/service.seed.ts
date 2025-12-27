import { PrismaClient } from '@prisma/client';

/**
 * Seed services data
 * @param prisma - Prisma client instance
 */
export const seedServices = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding services...');

  const services = [
    {
      name: 'Giặt ủi',
      price: 50000,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Minibar',
      price: 30000,
      unit: 'lần',
      isActive: true
    },
    {
      name: 'Bữa sáng',
      price: 150000,
      unit: 'phần',
      isActive: true
    },
    {
      name: 'Thuê xe máy',
      price: 200000,
      unit: 'ngày',
      isActive: true
    },
    {
      name: 'Thuê xe ô tô',
      price: 800000,
      unit: 'ngày',
      isActive: true
    },
    {
      name: 'Spa & Massage',
      price: 500000,
      unit: 'giờ',
      isActive: true
    },
    {
      name: 'Phòng gym',
      price: 100000,
      unit: 'lần',
      isActive: true
    },
    {
      name: 'Dịch vụ phòng',
      price: 50000,
      unit: 'lần',
      isActive: true
    },
    {
      name: 'Đưa đón sân bay',
      price: 350000,
      unit: 'lượt',
      isActive: true
    },
    {
      name: 'Bể bơi',
      price: 80000,
      unit: 'lần',
      isActive: true
    },
    {
      name: 'Giữ hành lý',
      price: 20000,
      unit: 'kiện/ngày',
      isActive: true
    },
    {
      name: 'Internet tốc độ cao',
      price: 100000,
      unit: 'ngày',
      isActive: false // Example inactive service
    }
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: {
        id: `seed_${service.name.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and')}`
      },
      update: {
        name: service.name,
        price: service.price,
        unit: service.unit,
        isActive: service.isActive
      },
      create: {
        id: `seed_${service.name.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and')}`,
        name: service.name,
        price: service.price,
        unit: service.unit,
        isActive: service.isActive
      }
    });
  }

  console.log(`✓ Created ${services.length} services`);
};

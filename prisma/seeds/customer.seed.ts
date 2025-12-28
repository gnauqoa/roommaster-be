import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils';

/**
 * Seed customers data
 * @param prisma - Prisma client instance
 */
export const seedCustomers = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding customers...');

  const customers = [
    {
      fullName: 'Nguyễn Văn An',
      email: 'nguyenvanan@example.com',
      phone: '0901234567',
      idNumber: '001234567890',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Trần Thị Bình',
      email: 'tranthibinh@example.com',
      phone: '0902345678',
      idNumber: '001234567891',
      address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Lê Văn Cường',
      email: 'levancuong@example.com',
      phone: '0903456789',
      idNumber: '001234567892',
      address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Phạm Thị Dung',
      email: 'phamthidung@example.com',
      phone: '0904567890',
      idNumber: '001234567893',
      address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Hoàng Văn Em',
      email: 'hoangvanem@example.com',
      phone: '0905678901',
      idNumber: '001234567894',
      address: '654 Đường Hai Bà Trưng, Quận 1, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Đặng Thị Phương',
      email: 'dangthiphuong@example.com',
      phone: '0906789012',
      idNumber: '001234567895',
      address: '987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Vũ Văn Giang',
      email: 'vuvangiang@example.com',
      phone: '0907890123',
      idNumber: '001234567896',
      address: '147 Đường Lý Thường Kiệt, Quận Tân Bình, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Bùi Thị Hoa',
      email: 'buithihoa@example.com',
      phone: '0908901234',
      idNumber: '001234567897',
      address: '258 Đường Phan Xích Long, Quận Phú Nhuận, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Đinh Văn Ích',
      email: 'dinhvanich@example.com',
      phone: '0909012345',
      idNumber: '001234567898',
      address: '369 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
      password: await hashPassword('password123')
    },
    {
      fullName: 'Mai Thị Kim',
      email: 'maithikim@example.com',
      phone: '0900123456',
      idNumber: '001234567899',
      address: '741 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
      password: await hashPassword('password123')
    }
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: customer
    });
  }

  console.log(`✓ Created ${customers.length} customers`);
};

/**
 * Get seeded customers for use in other seeds
 */
export const getSeededCustomers = async (prisma: PrismaClient) => {
  return prisma.customer.findMany({
    where: {
      phone: {
        startsWith: '090'
      }
    }
  });
};

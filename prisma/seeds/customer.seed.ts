import { PrismaClient, CustomerPromotionStatus } from '@prisma/client';
import { hashPassword } from './utils';

/**
 * Seed customers data
 * @param prisma - Prisma client instance
 */
export const seedCustomers = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding customers...');

  const customers = [
    {
      fullName: 'Test Customer',
      email: 'test@example.com',
      phone: '0987654321',
      idNumber: '001234567999',
      address: '123 Test Street, Test City',
      password: await hashPassword('password123')
    },
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

/**
 * Seed customer promotions
 * @param prisma - Prisma client instance
 */
export const seedCustomerPromotions = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding customer promotions...');

  // Get all customers and promotions
  const customers = await prisma.customer.findMany();
  const promotions = await prisma.promotion.findMany({
    where: {
      disabledAt: null
    }
  });

  if (customers.length === 0 || promotions.length === 0) {
    console.log('⚠ No customers or promotions found. Skipping customer promotions seeding.');
    return;
  }

  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 30); // 30 days ago

  const customerPromotions = [];

  // Assign promotions to customers with different statuses
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    // Each customer gets 2-3 promotions with different statuses
    const numPromotions = Math.min(2 + (i % 2), promotions.length);

    for (let j = 0; j < numPromotions; j++) {
      const promotion = promotions[j % promotions.length];

      // Determine status based on customer index
      let status: CustomerPromotionStatus;
      let claimedAt: Date;
      let usedAt: Date | null = null;

      if (i % 3 === 0 && j === 0) {
        // First customer in every 3: has a USED promotion
        status = CustomerPromotionStatus.USED;
        claimedAt = pastDate;
        usedAt = new Date(pastDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Used 7 days after claiming
      } else if (i % 3 === 1 && j === 0) {
        // Second customer in every 3: has an EXPIRED promotion
        status = CustomerPromotionStatus.EXPIRED;
        claimedAt = new Date(pastDate.getTime() - 60 * 24 * 60 * 60 * 1000); // Claimed 60 days ago
      } else {
        // Others: AVAILABLE promotions
        status = CustomerPromotionStatus.AVAILABLE;
        claimedAt = new Date(now.getTime() - (j + 1) * 24 * 60 * 60 * 1000); // Claimed j+1 days ago
      }

      customerPromotions.push({
        customerId: customer.id,
        promotionId: promotion.id,
        status,
        claimedAt,
        usedAt
      });
    }
  }

  // Create customer promotions
  for (const cp of customerPromotions) {
    await prisma.customerPromotion.upsert({
      where: {
        id: `${cp.customerId}-${cp.promotionId}-${cp.claimedAt.getTime()}`
      },
      update: {},
      create: cp
    });
  }

  console.log(`✓ Created ${customerPromotions.length} customer promotions`);
};

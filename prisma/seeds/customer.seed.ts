import { PrismaClient, CustomerPromotionStatus } from '@prisma/client';
import { hashPassword } from './utils';

/**
 * Seed customers data
 * @param prisma - Prisma client instance
 */
export const seedCustomers = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding customers...');

  // Get ranks first to assign to customers
  const ranks = await prisma.customerRank.findMany({
    orderBy: { minSpending: 'asc' }
  });

  const bronzeRank = ranks.find((r) => r.name.includes('Bronze') || r.name.includes('Đồng'));
  const silverRank = ranks.find((r) => r.name.includes('Silver') || r.name.includes('Bạc'));
  const goldRank = ranks.find((r) => r.name.includes('Gold') || r.name.includes('Vàng'));
  const platinumRank = ranks.find(
    (r) => r.name.includes('Platinum') || r.name.includes('Bạch Kim')
  );

  const customers = [
    // VIP customers (High spending)
    {
      fullName: 'Test Customer',
      email: 'test@example.com',
      phone: '0987654321',
      idNumber: '001234567999',
      address: '123 Test Street, Test City',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 95000000, // 95M VND - Platinum
      rankId: platinumRank?.id || goldRank?.id
    },
    {
      fullName: 'Nguyễn Văn An',
      email: 'nguyenvanan@example.com',
      phone: '0901234567',
      idNumber: '001234567890',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 75000000, // 75M VND - Gold
      rankId: goldRank?.id
    },

    // Regular customers (Medium spending)
    {
      fullName: 'Trần Thị Bình',
      email: 'tranthibinh@example.com',
      phone: '0902345678',
      idNumber: '001234567891',
      address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 35000000, // 35M VND - Silver
      rankId: silverRank?.id
    },
    {
      fullName: 'Lê Văn Cường',
      email: 'levancuong@example.com',
      phone: '0903456789',
      idNumber: '001234567892',
      address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 42000000, // 42M VND - Silver
      rankId: silverRank?.id
    },
    {
      fullName: 'Phạm Thị Dung',
      email: 'phamthidung@example.com',
      phone: '0904567890',
      idNumber: '001234567893',
      address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 28000000, // 28M VND - Silver
      rankId: silverRank?.id
    },

    // New customers (Low spending or first time)
    {
      fullName: 'Hoàng Văn Em',
      email: 'hoangvanem@example.com',
      phone: '0905678901',
      idNumber: '001234567894',
      address: '654 Đường Hai Bà Trưng, Quận 1, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 5500000, // 5.5M VND - Bronze
      rankId: bronzeRank?.id
    },
    {
      fullName: 'Đặng Thị Phương',
      email: 'dangthiphuong@example.com',
      phone: '0906789012',
      idNumber: '001234567895',
      address: '987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 8200000, // 8.2M VND - Bronze
      rankId: bronzeRank?.id
    },
    {
      fullName: 'Vũ Văn Giang',
      email: 'vuvangiang@example.com',
      phone: '0907890123',
      idNumber: '001234567896',
      address: '147 Đường Lý Thường Kiệt, Quận Tân Bình, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 12000000, // 12M VND - Bronze
      rankId: bronzeRank?.id
    },
    {
      fullName: 'Bùi Thị Hoa',
      email: 'buithihoa@example.com',
      phone: '0908901234',
      idNumber: '001234567897',
      address: '258 Đường Phan Xích Long, Quận Phú Nhuận, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 3400000, // 3.4M VND - Bronze (New customer)
      rankId: bronzeRank?.id
    },
    {
      fullName: 'Đinh Văn Ích',
      email: 'dinhvanich@example.com',
      phone: '0909012345',
      idNumber: '001234567898',
      address: '369 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 18500000, // 18.5M VND - Bronze
      rankId: bronzeRank?.id
    },
    {
      fullName: 'Mai Thị Kim',
      email: 'maithikim@example.com',
      phone: '0900123456',
      idNumber: '001234567899',
      address: '741 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 6800000, // 6.8M VND - Bronze
      rankId: bronzeRank?.id
    },
    // Additional customers for better data distribution
    {
      fullName: 'Phan Văn Long',
      email: 'phanvanlong@example.com',
      phone: '0911234567',
      idNumber: '001234567900',
      address: '159 Đường Pasteur, Quận 1, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 88000000, // 88M VND - Gold
      rankId: goldRank?.id
    },
    {
      fullName: 'Ngô Thị Mai',
      email: 'ngothimai@example.com',
      phone: '0912345678',
      idNumber: '001234567901',
      address: '753 Đường Võ Thị Sáu, Quận 3, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 52000000, // 52M VND - Silver
      rankId: silverRank?.id
    },
    {
      fullName: 'Trương Văn Nam',
      email: 'truongvannam@example.com',
      phone: '0913456789',
      idNumber: '001234567902',
      address: '852 Đường Cộng Hòa, Quận Tân Bình, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 92000000, // 92M VND - Platinum
      rankId: platinumRank?.id || goldRank?.id
    },
    {
      fullName: 'Lý Thị Oanh',
      email: 'lythioanh@example.com',
      phone: '0914567890',
      idNumber: '001234567903',
      address: '951 Đường Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP.HCM',
      password: await hashPassword('password123'),
      isEmailVerified: true,
      totalSpent: 15000000, // 15M VND - Bronze
      rankId: bronzeRank?.id
    }
  ];

  for (const customer of customers) {
    const { rankId, ...customerData } = customer;
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: {
        ...customerData,
        ...(rankId && { rankId })
      }
    });
  }

  console.log(`✓ Created ${customers.length} customers with rank distribution`);
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

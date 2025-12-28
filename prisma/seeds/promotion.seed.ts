import { PrismaClient, PromotionType, PromotionScope } from '@prisma/client';

/**
 * Seed promotions data
 * @param prisma - Prisma client instance
 */
export const seedPromotions = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding promotions...');

  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3);

  const promotions = [
    {
      code: 'WELCOME2024',
      description: 'Giảm giá 10% cho khách hàng mới',
      type: PromotionType.PERCENTAGE,
      scope: PromotionScope.ALL,
      value: 10,
      maxDiscount: 500000,
      minBookingAmount: 1000000,
      startDate: now,
      endDate: futureDate,
      totalQty: 100,
      remainingQty: 100,
      perCustomerLimit: 1,
      disabledAt: null
    },
    {
      code: 'ROOM50K',
      description: 'Giảm 50.000đ cho tiền phòng',
      type: PromotionType.FIXED_AMOUNT,
      scope: PromotionScope.ROOM,
      value: 50000,
      maxDiscount: null,
      minBookingAmount: 500000,
      startDate: now,
      endDate: futureDate,
      totalQty: null, // Unlimited
      remainingQty: null,
      perCustomerLimit: 3,
      disabledAt: null
    },
    {
      code: 'SERVICE20',
      description: 'Giảm 20% cho dịch vụ',
      type: PromotionType.PERCENTAGE,
      scope: PromotionScope.SERVICE,
      value: 20,
      maxDiscount: 200000,
      minBookingAmount: 0,
      startDate: now,
      endDate: futureDate,
      totalQty: 50,
      remainingQty: 50,
      perCustomerLimit: 2,
      disabledAt: null
    },
    {
      code: 'SUMMER2024',
      description: 'Khuyến mãi mùa hè - Giảm 15%',
      type: PromotionType.PERCENTAGE,
      scope: PromotionScope.ALL,
      value: 15,
      maxDiscount: 1000000,
      minBookingAmount: 2000000,
      startDate: now,
      endDate: futureDate,
      totalQty: 200,
      remainingQty: 200,
      perCustomerLimit: 1,
      disabledAt: null
    }
  ];

  for (const promo of promotions) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: promo,
      create: promo
    });
  }

  console.log(`✓ Created ${promotions.length} promotions`);
};

/**
 * Get seeded promotions for use in other seeds
 */
export const getSeededPromotions = async (prisma: PrismaClient) => {
  return prisma.promotion.findMany({
    where: {
      disabledAt: null
    }
  });
};

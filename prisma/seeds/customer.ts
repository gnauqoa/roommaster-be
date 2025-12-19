import prisma from '../../src/prisma';

export const seedCustomerTiers = async () => {
  console.log('⭐ Seeding customer tiers...');

  const tiers = [
    {
      code: 'REGULAR',
      name: 'Regular',
      pointsRequired: 0,
      roomDiscountFactor: 0,
      serviceDiscountFactor: 0
    },
    {
      code: 'SILVER',
      name: 'Silver',
      pointsRequired: 100,
      roomDiscountFactor: 5,
      serviceDiscountFactor: 3
    },
    {
      code: 'GOLD',
      name: 'Gold',
      pointsRequired: 500,
      roomDiscountFactor: 10,
      serviceDiscountFactor: 7
    },
    {
      code: 'PLATINUM',
      name: 'Platinum',
      pointsRequired: 1500,
      roomDiscountFactor: 15,
      serviceDiscountFactor: 12
    },
    {
      code: 'VIP',
      name: 'VIP',
      pointsRequired: 3000,
      roomDiscountFactor: 25,
      serviceDiscountFactor: 20
    }
  ];

  for (const tier of tiers) {
    await prisma.customerTier.upsert({
      where: { code: tier.code },
      update: {},
      create: tier
    });
  }

  console.log('✅ Customer tiers seeded successfully!');
};

export const seedCustomers = async () => {
  console.log('👤 Seeding customers...');

  const regularTier = await prisma.customerTier.findUnique({ where: { code: 'REGULAR' } });
  const silverTier = await prisma.customerTier.findUnique({ where: { code: 'SILVER' } });
  const goldTier = await prisma.customerTier.findUnique({ where: { code: 'GOLD' } });

  const customers = [
    {
      code: 'CUST001',
      fullName: 'Nguyễn Văn An',
      phone: '0901234567',
      email: 'nguyenvanan@email.com',
      idNumber: '001234567890',
      nationality: 'Vietnam',
      address: '123 Đường Lê Lợi, Q.1, TP.HCM',
      customerType: 'INDIVIDUAL' as const,
      tierId: regularTier?.id,
      loyaltyPoints: 0,
      totalSpending: 0,
      totalNights: 0
    },
    {
      code: 'CUST002',
      fullName: 'Trần Thị Bình',
      phone: '0902345678',
      email: 'tranthib@email.com',
      idNumber: '001234567891',
      nationality: 'Vietnam',
      address: '456 Nguyễn Huệ, Q.1, TP.HCM',
      customerType: 'INDIVIDUAL' as const,
      tierId: silverTier?.id,
      loyaltyPoints: 150,
      totalSpending: 5000000,
      totalNights: 5
    },
    {
      code: 'CORP001',
      fullName: 'ABC Corporation',
      phone: '0283456789',
      email: 'contact@abc-corp.com',
      idNumber: '0123456789',
      nationality: 'Vietnam',
      address: '789 Tôn Đức Thắng, Q.1, TP.HCM',
      customerType: 'CORPORATE' as const,
      tierId: goldTier?.id,
      loyaltyPoints: 800,
      totalSpending: 25000000,
      totalNights: 20
    },
    {
      code: 'CUST003',
      fullName: 'John Smith',
      phone: '+1234567890',
      email: 'john.smith@email.com',
      idNumber: 'P123456789',
      nationality: 'USA',
      address: '123 Main St, New York, USA',
      customerType: 'INDIVIDUAL' as const,
      tierId: regularTier?.id,
      loyaltyPoints: 0,
      totalSpending: 0,
      totalNights: 0
    },
    {
      code: 'TA001',
      fullName: 'Travel Agent XYZ',
      phone: '0284567890',
      email: 'booking@travelxyz.com',
      idNumber: '9876543210',
      nationality: 'Vietnam',
      address: '321 Pasteur, Q.3, TP.HCM',
      customerType: 'TRAVEL_AGENT' as const,
      tierId: goldTier?.id,
      loyaltyPoints: 1200,
      totalSpending: 50000000,
      totalNights: 50
    }
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: {},
      create: customer
    });
  }

  console.log('✅ Customers seeded successfully!');
};

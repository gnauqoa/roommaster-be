import prisma from '../../src/prisma';
import { CustomerType } from '@prisma/client';

export const seedCustomerTiers = async () => {
  console.log('🏆 Seeding customer tiers...');

  const tiers = [
    {
      code: 'REGULAR',
      name: 'Regular',
      pointsRequired: 0,
      roomDiscountFactor: 1.0,
      serviceDiscountFactor: 1.0
    },
    {
      code: 'SILVER',
      name: 'Silver Member',
      pointsRequired: 1000,
      roomDiscountFactor: 0.95,
      serviceDiscountFactor: 0.95
    },
    {
      code: 'GOLD',
      name: 'Gold Member',
      pointsRequired: 5000,
      roomDiscountFactor: 0.9,
      serviceDiscountFactor: 0.9
    },
    {
      code: 'PLATINUM',
      name: 'Platinum Member',
      pointsRequired: 15000,
      roomDiscountFactor: 0.85,
      serviceDiscountFactor: 0.85
    },
    {
      code: 'VIP',
      name: 'VIP',
      pointsRequired: 50000,
      roomDiscountFactor: 0.8,
      serviceDiscountFactor: 0.8
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
  console.log('👥 Seeding customers...');

  const regularTier = await prisma.customerTier.findUnique({ where: { code: 'REGULAR' } });
  const goldTier = await prisma.customerTier.findUnique({ where: { code: 'GOLD' } });

  const customers = [
    {
      code: 'CUST001',
      fullName: 'Nguyen Van A',
      email: 'nguyenvana@email.com',
      phone: '0901234567',
      idNumber: '001234567890',
      nationality: 'Vietnamese',
      address: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      customerType: CustomerType.INDIVIDUAL,
      tierId: regularTier?.id ?? null
    },
    {
      code: 'CUST002',
      fullName: 'Tran Thi B',
      email: 'tranthib@email.com',
      phone: '0902345678',
      idNumber: '001234567891',
      nationality: 'Vietnamese',
      address: '456 Le Loi, District 3, Ho Chi Minh City',
      customerType: CustomerType.INDIVIDUAL,
      tierId: goldTier?.id ?? null
    },
    {
      code: 'CUST003',
      fullName: 'ABC Company',
      email: 'booking@abccompany.com',
      phone: '02812345678',
      address: '789 Hai Ba Trung, District 1, Ho Chi Minh City',
      customerType: CustomerType.CORPORATE,
      tierId: regularTier?.id ?? null
    },
    {
      code: 'CUST004',
      fullName: 'XYZ Travel Agency',
      email: 'reservations@xyztravel.com',
      phone: '02823456789',
      address: '321 Dong Khoi, District 1, Ho Chi Minh City',
      customerType: CustomerType.TRAVEL_AGENT,
      tierId: regularTier?.id ?? null
    },
    {
      code: 'CUST005',
      fullName: 'John Smith',
      email: 'johnsmith@email.com',
      phone: '+1234567890',
      idNumber: 'US123456789',
      nationality: 'American',
      address: '123 Main St, New York, USA',
      customerType: CustomerType.INDIVIDUAL,
      tierId: regularTier?.id ?? null
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

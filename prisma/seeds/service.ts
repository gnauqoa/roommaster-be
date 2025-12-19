import prisma from '../../src/prisma';
import { ServiceGroup } from '@prisma/client';

export const seedPaymentMethods = async () => {
  console.log('💳 Seeding payment methods...');

  const paymentMethods = [
    { code: 'CASH', name: 'Cash', transactionFee: 0 },
    { code: 'CARD', name: 'Credit/Debit Card', transactionFee: 2.5 },
    { code: 'BANK_TRANSFER', name: 'Bank Transfer', transactionFee: 0 },
    { code: 'E_WALLET', name: 'E-Wallet (Momo/ZaloPay)', transactionFee: 1.5 }
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method
    });
  }

  console.log('✅ Payment methods seeded successfully!');
};

export const seedServices = async () => {
  console.log('🛎️ Seeding services...');

  const services = [
    // F&B Services
    {
      code: 'FB001',
      name: 'Breakfast Buffet',
      unitPrice: 150000,
      unit: 'person',
      serviceGroup: ServiceGroup.F_AND_B
    },
    {
      code: 'FB002',
      name: 'Lunch Set Menu',
      unitPrice: 200000,
      unit: 'set',
      serviceGroup: ServiceGroup.F_AND_B
    },
    {
      code: 'FB003',
      name: 'Dinner À la carte',
      unitPrice: 350000,
      unit: 'person',
      serviceGroup: ServiceGroup.F_AND_B
    },
    {
      code: 'FB004',
      name: 'Room Service - Breakfast',
      unitPrice: 180000,
      unit: 'order',
      serviceGroup: ServiceGroup.ROOM_SERVICE
    },
    {
      code: 'FB005',
      name: 'Room Service - Snacks',
      unitPrice: 80000,
      unit: 'order',
      serviceGroup: ServiceGroup.ROOM_SERVICE
    },

    // Minibar Items
    {
      code: 'MB001',
      name: 'Soft Drink (Can)',
      unitPrice: 25000,
      unit: 'can',
      serviceGroup: ServiceGroup.MINIBAR
    },
    {
      code: 'MB002',
      name: 'Beer (Bottle)',
      unitPrice: 45000,
      unit: 'bottle',
      serviceGroup: ServiceGroup.MINIBAR
    },
    {
      code: 'MB003',
      name: 'Mineral Water (500ml)',
      unitPrice: 15000,
      unit: 'bottle',
      serviceGroup: ServiceGroup.MINIBAR
    },
    {
      code: 'MB004',
      name: 'Snacks Pack',
      unitPrice: 35000,
      unit: 'pack',
      serviceGroup: ServiceGroup.MINIBAR
    },

    // Laundry Services
    {
      code: 'LD001',
      name: 'Shirt/Blouse Laundry',
      unitPrice: 40000,
      unit: 'piece',
      serviceGroup: ServiceGroup.LAUNDRY
    },
    {
      code: 'LD002',
      name: 'Pants/Skirt Laundry',
      unitPrice: 45000,
      unit: 'piece',
      serviceGroup: ServiceGroup.LAUNDRY
    },
    {
      code: 'LD003',
      name: 'Suit Dry Clean',
      unitPrice: 120000,
      unit: 'set',
      serviceGroup: ServiceGroup.LAUNDRY
    },
    {
      code: 'LD004',
      name: 'Express Laundry (2hrs)',
      unitPrice: 200000,
      unit: 'batch',
      serviceGroup: ServiceGroup.LAUNDRY
    },

    // Spa Services
    {
      code: 'SP001',
      name: 'Traditional Massage (60 min)',
      unitPrice: 450000,
      unit: 'session',
      serviceGroup: ServiceGroup.SPA
    },
    {
      code: 'SP002',
      name: 'Aromatherapy (90 min)',
      unitPrice: 650000,
      unit: 'session',
      serviceGroup: ServiceGroup.SPA
    },
    {
      code: 'SP003',
      name: 'Facial Treatment',
      unitPrice: 550000,
      unit: 'session',
      serviceGroup: ServiceGroup.SPA
    },

    // Surcharges
    {
      code: 'SC001',
      name: 'Late Checkout Fee',
      unitPrice: 150000,
      unit: 'hour',
      serviceGroup: ServiceGroup.SURCHARGE,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'SC002',
      name: 'Extra Bed',
      unitPrice: 200000,
      unit: 'night',
      serviceGroup: ServiceGroup.SURCHARGE
    },
    {
      code: 'SC003',
      name: 'Airport Pickup',
      unitPrice: 350000,
      unit: 'trip',
      serviceGroup: ServiceGroup.OTHER
    },

    // Penalties
    {
      code: 'PN001',
      name: 'Smoking in Non-Smoking Room',
      unitPrice: 500000,
      unit: 'fine',
      serviceGroup: ServiceGroup.PENALTY,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'PN002',
      name: 'Lost Key Card',
      unitPrice: 100000,
      unit: 'piece',
      serviceGroup: ServiceGroup.PENALTY,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'PN003',
      name: 'Minibar Item Damage',
      unitPrice: 200000,
      unit: 'item',
      serviceGroup: ServiceGroup.PENALTY,
      allowPromotion: false,
      allowDiscount: false
    }
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      update: {},
      create: service
    });
  }

  console.log('✅ Services seeded successfully!');
};

import prisma from '../../src/prisma';
import { ServiceGroup } from '@prisma/client';

export const seedServices = async () => {
  console.log('🛎️ Seeding services...');

  const services = [
    // Room Services
    {
      code: 'EXTRA_BED',
      name: 'Extra Bed',
      unitPrice: 200000,
      unit: 'night',
      serviceGroup: ServiceGroup.ROOM_SERVICE,
      allowPromotion: false,
      allowDiscount: true
    },
    {
      code: 'LATE_CO',
      name: 'Late Check-out',
      unitPrice: 300000,
      unit: 'once',
      serviceGroup: ServiceGroup.ROOM_SERVICE,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'EARLY_CI',
      name: 'Early Check-in',
      unitPrice: 300000,
      unit: 'once',
      serviceGroup: ServiceGroup.ROOM_SERVICE,
      allowPromotion: false,
      allowDiscount: false
    },

    // F&B Services
    {
      code: 'BFAST',
      name: 'Breakfast Buffet',
      unitPrice: 250000,
      unit: 'person',
      serviceGroup: ServiceGroup.F_AND_B,
      allowPromotion: true,
      allowDiscount: true
    },
    {
      code: 'LUNCH',
      name: 'Lunch Set Menu',
      unitPrice: 350000,
      unit: 'person',
      serviceGroup: ServiceGroup.F_AND_B,
      allowPromotion: true,
      allowDiscount: true
    },
    {
      code: 'DINNER',
      name: 'Dinner Set Menu',
      unitPrice: 450000,
      unit: 'person',
      serviceGroup: ServiceGroup.F_AND_B,
      allowPromotion: true,
      allowDiscount: true
    },
    {
      code: 'ROOM_DELIVERY',
      name: 'Room Service Delivery',
      unitPrice: 50000,
      unit: 'order',
      serviceGroup: ServiceGroup.ROOM_SERVICE,
      allowPromotion: false,
      allowDiscount: false
    },

    // Laundry
    {
      code: 'LAUNDRY_REG',
      name: 'Regular Laundry',
      unitPrice: 50000,
      unit: 'piece',
      serviceGroup: ServiceGroup.LAUNDRY,
      allowPromotion: false,
      allowDiscount: true
    },
    {
      code: 'LAUNDRY_EXP',
      name: 'Express Laundry',
      unitPrice: 100000,
      unit: 'piece',
      serviceGroup: ServiceGroup.LAUNDRY,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'DRY_CLEAN',
      name: 'Dry Cleaning',
      unitPrice: 80000,
      unit: 'piece',
      serviceGroup: ServiceGroup.LAUNDRY,
      allowPromotion: false,
      allowDiscount: true
    },

    // Minibar
    {
      code: 'MINI_WATER',
      name: 'Mineral Water',
      unitPrice: 25000,
      unit: 'bottle',
      serviceGroup: ServiceGroup.MINIBAR,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'MINI_SODA',
      name: 'Soft Drink',
      unitPrice: 35000,
      unit: 'can',
      serviceGroup: ServiceGroup.MINIBAR,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'MINI_BEER',
      name: 'Beer',
      unitPrice: 50000,
      unit: 'can',
      serviceGroup: ServiceGroup.MINIBAR,
      allowPromotion: false,
      allowDiscount: false
    },
    {
      code: 'MINI_SNACK',
      name: 'Snacks',
      unitPrice: 45000,
      unit: 'pack',
      serviceGroup: ServiceGroup.MINIBAR,
      allowPromotion: false,
      allowDiscount: false
    },

    // SPA
    {
      code: 'GYM',
      name: 'Gym Access',
      unitPrice: 100000,
      unit: 'day',
      serviceGroup: ServiceGroup.SPA,
      allowPromotion: true,
      allowDiscount: true
    },
    {
      code: 'SPA_BASIC',
      name: 'Basic Spa Treatment',
      unitPrice: 500000,
      unit: 'session',
      serviceGroup: ServiceGroup.SPA,
      allowPromotion: true,
      allowDiscount: true
    },

    // Other
    {
      code: 'AIRPORT_PICKUP',
      name: 'Airport Pickup',
      unitPrice: 400000,
      unit: 'trip',
      serviceGroup: ServiceGroup.OTHER,
      allowPromotion: false,
      allowDiscount: true
    },
    {
      code: 'AIRPORT_DROP',
      name: 'Airport Drop-off',
      unitPrice: 350000,
      unit: 'trip',
      serviceGroup: ServiceGroup.OTHER,
      allowPromotion: false,
      allowDiscount: true
    },
    {
      code: 'PARKING',
      name: 'Parking',
      unitPrice: 50000,
      unit: 'day',
      serviceGroup: ServiceGroup.OTHER,
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

export const seedPaymentMethods = async () => {
  console.log('💳 Seeding payment methods...');

  const paymentMethods = [
    { code: 'CASH', name: 'Cash' },
    { code: 'VISA', name: 'Visa Card' },
    { code: 'MASTER', name: 'Mastercard' },
    { code: 'AMEX', name: 'American Express' },
    { code: 'TRANSFER', name: 'Bank Transfer' },
    { code: 'MOMO', name: 'MoMo' },
    { code: 'ZALOPAY', name: 'ZaloPay' },
    { code: 'VNPAY', name: 'VNPay' },
    { code: 'CITY_LEDGER', name: 'City Ledger' },
    { code: 'VOUCHER', name: 'Voucher' }
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

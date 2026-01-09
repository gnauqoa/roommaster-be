import { PrismaClient } from '@prisma/client';
import { APP_SETTING_KEYS } from '../../src/constants/app-settings.constant';

const prisma = new PrismaClient();

async function seedAppSettings() {
  console.log('Seeding app settings...');

  // First, get the penalty and surcharge service IDs
  const penaltyService = await prisma.service.findFirst({
    where: { name: 'Phạt' }
  });

  const surchargeService = await prisma.service.findFirst({
    where: { name: 'Phụ thu' }
  });

  if (!penaltyService) {
    console.warn('⚠ Penalty service not found. Please seed services first.');
  }

  if (!surchargeService) {
    console.warn('⚠ Surcharge service not found. Please seed services first.');
  }

  const settings = [
    {
      key: APP_SETTING_KEYS.CHECKIN_TIME,
      value: {
        hour: 14,
        minute: 0,
        gracePeriodMinutes: 60
      },
      description: 'Standard check-in time (2:00 PM with 60-minute grace period)'
    },
    {
      key: APP_SETTING_KEYS.CHECKOUT_TIME,
      value: {
        hour: 12,
        minute: 0,
        gracePeriodMinutes: 60
      },
      description: 'Standard check-out time (12:00 PM with 60-minute grace period)'
    },
    {
      key: APP_SETTING_KEYS.DEPOSIT_PERCENTAGE,
      value: {
        percentage: 30
      },
      description: 'Deposit percentage of total booking amount (30%)'
    }
  ];

  // Add penalty and surcharge service IDs if they exist
  if (penaltyService) {
    settings.push({
      key: APP_SETTING_KEYS.PENALTY_SERVICE_ID,
      value: {
        serviceId: penaltyService.id
      },
      description: 'Penalty service ID for custom penalty charges'
    });
  }

  if (surchargeService) {
    settings.push({
      key: APP_SETTING_KEYS.SURCHARGE_SERVICE_ID,
      value: {
        serviceId: surchargeService.id
      },
      description: 'Surcharge service ID for custom surcharge fees'
    });
  }

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {
        value: setting.value,
        description: setting.description
      }
    });
    console.log(`✓ Seeded app setting: ${setting.key}`);
  }

  console.log('App settings seeded successfully!');
}

async function main() {
  try {
    await seedAppSettings();
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

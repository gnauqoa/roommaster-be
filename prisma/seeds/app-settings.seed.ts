import { PrismaClient } from '@prisma/client';
import { APP_SETTING_KEYS } from '../../src/constants/app-settings.constant';

const prisma = new PrismaClient();

async function seedAppSettings() {
  console.log('Seeding app settings...');

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

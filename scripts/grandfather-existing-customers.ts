/**
 * Migration Script: Grandfather Existing Customers
 * 
 * This script sets isEmailVerified = true for all existing customers
 * as part of the email verification feature rollout.
 * 
 * Usage: npx ts-node scripts/grandfather-existing-customers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting migration: Grandfathering existing customers...');

  try {
    // Update all existing customers to have verified emails
    const result = await prisma.customer.updateMany({
      where: {
        isEmailVerified: false
      },
      data: {
        isEmailVerified: true
      }
    });

    console.log(`✅ Successfully updated ${result.count} existing customers`);
    console.log('   - Set isEmailVerified = true for all existing customers');
    console.log('   - These customers can now access all features without email verification');
    console.log('\n📝 Note: New customers will still need to verify their email');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

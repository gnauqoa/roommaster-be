import prisma from '../../src/prisma';
import { PERMISSIONS } from '../../src/config/roles';

/**
 * Seeds SystemFunctions (permissions) into the database
 */
export const seedSystemFunctions = async () => {
  console.log('🔐 Seeding system functions (permissions)...');

  const permissions = Object.values(PERMISSIONS);

  for (const permission of permissions) {
    await prisma.systemFunction.upsert({
      where: { functionKey: permission },
      update: {},
      create: {
        code: permission,
        name: permission
          .split('.')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        functionKey: permission
      }
    });
  }

  console.log(`✅ ${permissions.length} system functions seeded successfully!`);
};

/**
 * Seeds the 5 default UserGroups with their permissions
 */
export const seedUserGroups = async () => {
  console.log('👥 Seeding user groups...');

  // Admin - Full access to everything
  const ADMIN_GROUP = await prisma.userGroup.upsert({
    where: { code: 'ADMIN_GROUP' },
    update: {},
    create: {
      code: 'ADMIN_GROUP',
      name: 'Administrator',
      description: 'Full system access with all permissions'
    }
  });

  // Receptionist - Guest management, reservations, check-in/out
  const RECEPTIONIST_GROUP = await prisma.userGroup.upsert({
    where: { code: 'RECEPTIONIST_GROUP' },
    update: {},
    create: {
      code: 'RECEPTIONIST_GROUP',
      name: 'Receptionist',
      description: 'Front desk operations including reservations and guest management'
    }
  });

  // Cashier - Financial operations
  const CASHIER_GROUP = await prisma.userGroup.upsert({
    where: { code: 'CASHIER_GROUP' },
    update: {},
    create: {
      code: 'CASHIER_GROUP',
      name: 'Cashier',
      description: 'Financial operations including invoices, payments, and shift management'
    }
  });

  // Housekeeper - Room cleaning and maintenance
  const HOUSEKEEPER_GROUP = await prisma.userGroup.upsert({
    where: { code: 'HOUSEKEEPER_GROUP' },
    update: {},
    create: {
      code: 'HOUSEKEEPER_GROUP',
      name: 'Housekeeper',
      description: 'Housekeeping operations and room inspections'
    }
  });

  // Waiter - F&B services
  const WAITER_GROUP = await prisma.userGroup.upsert({
    where: { code: 'WAITER_GROUP' },
    update: {},
    create: {
      code: 'WAITER_GROUP',
      name: 'Waiter',
      description: 'Food & Beverage service operations'
    }
  });

  console.log('✅ User groups created successfully!');

  // Now assign permissions to each group
  await assignPermissions(ADMIN_GROUP.id, [
    ...Object.values(PERMISSIONS) // Admin gets all permissions
  ]);

  await assignPermissions(RECEPTIONIST_GROUP.id, [
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_TIER_READ,
    PERMISSIONS.RESERVATION_CREATE,
    PERMISSIONS.RESERVATION_READ,
    PERMISSIONS.RESERVATION_UPDATE,
    PERMISSIONS.STAY_RECORD_CREATE,
    PERMISSIONS.STAY_RECORD_READ,
    PERMISSIONS.STAY_RECORD_UPDATE,
    PERMISSIONS.ROOM_READ,
    PERMISSIONS.ROOM_UPDATE,
    PERMISSIONS.FOLIO_READ,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.REPORT_READ
  ]);

  await assignPermissions(CASHIER_GROUP.id, [
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.FOLIO_CREATE,
    PERMISSIONS.FOLIO_READ,
    PERMISSIONS.FOLIO_UPDATE,
    PERMISSIONS.SHIFT_CREATE,
    PERMISSIONS.SHIFT_READ,
    PERMISSIONS.SHIFT_SESSION_MANAGE,
    PERMISSIONS.SHIFT_SESSION_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.REPORT_READ
  ]);

  await assignPermissions(HOUSEKEEPER_GROUP.id, [
    PERMISSIONS.HOUSEKEEPING_CREATE,
    PERMISSIONS.HOUSEKEEPING_READ,
    PERMISSIONS.HOUSEKEEPING_UPDATE,
    PERMISSIONS.INSPECTION_CREATE,
    PERMISSIONS.INSPECTION_READ,
    PERMISSIONS.INSPECTION_UPDATE,
    PERMISSIONS.ROOM_READ,
    PERMISSIONS.ROOM_UPDATE
  ]);

  await assignPermissions(WAITER_GROUP.id, [
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.FOLIO_CREATE,
    PERMISSIONS.FOLIO_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.STAY_RECORD_READ
  ]);

  console.log('✅ Permissions assigned to user groups!');
};

/**
 * Helper function to assign permissions to a user group
 */
const assignPermissions = async (userGroupId: number, permissionCodes: string[]) => {
  for (const code of permissionCodes) {
    const systemFunction = await prisma.systemFunction.findUnique({
      where: { functionKey: code }
    });

    if (systemFunction) {
      await prisma.permission.upsert({
        where: {
          groupId_functionId: {
            groupId: userGroupId,
            functionId: systemFunction.id
          }
        },
        update: {},
        create: {
          groupId: userGroupId,
          functionId: systemFunction.id
        }
      });
    }
  }
};

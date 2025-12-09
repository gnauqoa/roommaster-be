import prisma from '../../src/prisma';
import { PERMISSIONS } from '../../src/config/roles';

export const seedSystemFunctions = async () => {
  console.log('⚙️ Seeding system functions (permissions)...');

  const functions = Object.entries(PERMISSIONS).map(([key, value]) => {
    // Convert 'employee.create' to 'Employee Create'
    const name = value
      .split('.')
      .map((part) => part.replace(/_/g, ' '))
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' - ');

    return {
      code: key, // EMPLOYEE_CREATE
      name, // Employee - Create
      functionKey: value // employee.create
    };
  });

  for (const func of functions) {
    await prisma.systemFunction.upsert({
      where: { functionKey: func.functionKey },
      update: { code: func.code, name: func.name },
      create: func
    });
  }

  console.log(`✅ ${functions.length} system functions seeded successfully!`);
};

export const seedUserGroups = async () => {
  console.log('👥 Seeding user groups...');

  const P = PERMISSIONS;

  const groups = [
    {
      code: 'ADMIN_GROUP',
      name: 'Administrators',
      description: 'Full system access with all permissions',
      permissions: Object.values(PERMISSIONS) // All permissions
    },
    {
      code: 'RECEPTIONIST_GROUP',
      name: 'Receptionists',
      description: 'Front desk operations - reservations, check-in/out, customer management',
      permissions: [
        // Customer - full CRUD
        P.CUSTOMER_CREATE,
        P.CUSTOMER_READ,
        P.CUSTOMER_UPDATE,
        P.CUSTOMER_DELETE,
        P.CUSTOMER_TIER_READ,
        // Reservation - full CRUD
        P.RESERVATION_CREATE,
        P.RESERVATION_READ,
        P.RESERVATION_UPDATE,
        P.RESERVATION_DELETE,
        // Stay record - full CRUD
        P.STAY_RECORD_CREATE,
        P.STAY_RECORD_READ,
        P.STAY_RECORD_UPDATE,
        P.STAY_RECORD_DELETE,
        // Folio - full CRUD
        P.FOLIO_CREATE,
        P.FOLIO_READ,
        P.FOLIO_UPDATE,
        P.FOLIO_DELETE,
        // Payment - create and read
        P.PAYMENT_CREATE,
        P.PAYMENT_READ,
        // Room - read only
        P.ROOM_READ,
        P.ROOM_TYPE_READ,
        // Service - read only
        P.SERVICE_READ,
        // Promotion - read only
        P.PROMOTION_READ
      ]
    },
    {
      code: 'CASHIER_GROUP',
      name: 'Cashiers',
      description: 'Payment processing and billing operations',
      permissions: [
        // Folio - full CRUD
        P.FOLIO_CREATE,
        P.FOLIO_READ,
        P.FOLIO_UPDATE,
        P.FOLIO_DELETE,
        // Payment - full CRUD
        P.PAYMENT_CREATE,
        P.PAYMENT_READ,
        P.PAYMENT_UPDATE,
        P.PAYMENT_DELETE,
        // Customer - read only
        P.CUSTOMER_READ,
        // Stay record - read only
        P.STAY_RECORD_READ,
        // Shift - create and read
        P.SHIFT_CREATE,
        P.SHIFT_READ,
        // Service - read only
        P.SERVICE_READ
      ]
    },
    {
      code: 'HOUSEKEEPER_GROUP',
      name: 'Housekeepers',
      description: 'Room cleaning and housekeeping tasks',
      permissions: [
        // Housekeeping - full CRUD
        P.HOUSEKEEPING_CREATE,
        P.HOUSEKEEPING_READ,
        P.HOUSEKEEPING_UPDATE,
        P.HOUSEKEEPING_DELETE,
        // Room - read and update
        P.ROOM_READ,
        P.ROOM_UPDATE
      ]
    },
    {
      code: 'WAITER_GROUP',
      name: 'Waiters/Service Staff',
      description: 'Food & beverage and service charge operations',
      permissions: [
        // Service - read only
        P.SERVICE_READ,
        // Folio - create and read (for adding charges)
        P.FOLIO_CREATE,
        P.FOLIO_READ,
        // Stay record - read only
        P.STAY_RECORD_READ
      ]
    }
  ];

  for (const group of groups) {
    // Create or update user group
    const userGroup = await prisma.userGroup.upsert({
      where: { code: group.code },
      update: { name: group.name, description: group.description },
      create: {
        code: group.code,
        name: group.name,
        description: group.description
      }
    });

    // Get system function IDs for the permissions
    const systemFunctions = await prisma.systemFunction.findMany({
      where: { functionKey: { in: group.permissions } }
    });

    // Delete existing permissions for this group
    await prisma.permission.deleteMany({
      where: { groupId: userGroup.id }
    });

    // Create new permissions
    for (const func of systemFunctions) {
      await prisma.permission.create({
        data: {
          groupId: userGroup.id,
          functionId: func.id
        }
      });
    }

    console.log(`  ✓ ${group.name}: ${systemFunctions.length} permissions assigned`);
  }

  console.log('✅ User groups seeded successfully!');
};

export const assignUserGroupsToEmployees = async () => {
  console.log('🔗 Assigning user groups to employees...');

  const roleToGroupCode: Record<string, string> = {
    ADMIN: 'ADMIN_GROUP',
    RECEPTIONIST: 'RECEPTIONIST_GROUP',
    CASHIER: 'CASHIER_GROUP',
    HOUSEKEEPER: 'HOUSEKEEPER_GROUP',
    WAITER: 'WAITER_GROUP'
  };

  for (const [role, groupCode] of Object.entries(roleToGroupCode)) {
    const userGroup = await prisma.userGroup.findUnique({
      where: { code: groupCode }
    });

    if (userGroup) {
      const result = await prisma.employee.updateMany({
        where: { role: role as any, userGroupId: null },
        data: { userGroupId: userGroup.id }
      });
      if (result.count > 0) {
        console.log(`  ✓ Assigned ${result.count} ${role}(s) to ${groupCode}`);
      }
    }
  }

  console.log('✅ User groups assigned to employees!');
};

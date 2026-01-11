import { PrismaClient, PermissionType } from '@prisma/client';

// Screen permissions use "access" action
// Action permissions use CRUD actions

const PERMISSIONS = {
  // ============ SCREEN PERMISSIONS ============
  screens: [
    {
      name: 'screen:dashboard',
      subject: 'Dashboard',
      action: 'access',
      description: 'Dashboard Overview'
    },
    {
      name: 'screen:booking',
      subject: 'Booking',
      action: 'access',
      description: 'Booking Management'
    },
    { name: 'screen:room', subject: 'Room', action: 'access', description: 'Room Management' },
    {
      name: 'screen:customer',
      subject: 'Customer',
      action: 'access',
      description: 'Customer Management'
    },
    {
      name: 'screen:employee',
      subject: 'Employee',
      action: 'access',
      description: 'Employee Management'
    },
    {
      name: 'screen:service',
      subject: 'Service',
      action: 'access',
      description: 'Service Management'
    },
    {
      name: 'screen:transaction',
      subject: 'Transaction',
      action: 'access',
      description: 'Transaction Management'
    },
    {
      name: 'screen:report',
      subject: 'Report',
      action: 'access',
      description: 'Reports & Analytics'
    },
    {
      name: 'screen:settings',
      subject: 'Settings',
      action: 'access',
      description: 'System Settings'
    },
    { name: 'screen:role', subject: 'Role', action: 'access', description: 'Role Management' },
    {
      name: 'screen:rank',
      subject: 'CustomerRank',
      action: 'access',
      description: 'Customer Rank Management'
    }
  ],

  // ============ ACTION PERMISSIONS ============
  actions: [
    // Booking actions
    { name: 'booking:create', subject: 'Booking', action: 'create', screen: 'screen:booking' },
    { name: 'booking:read', subject: 'Booking', action: 'read', screen: 'screen:booking' },
    { name: 'booking:update', subject: 'Booking', action: 'update', screen: 'screen:booking' },
    { name: 'booking:delete', subject: 'Booking', action: 'delete', screen: 'screen:booking' },
    { name: 'booking:checkIn', subject: 'Booking', action: 'checkIn', screen: 'screen:booking' },
    { name: 'booking:checkOut', subject: 'Booking', action: 'checkOut', screen: 'screen:booking' },
    { name: 'booking:cancel', subject: 'Booking', action: 'cancel', screen: 'screen:booking' },

    // Room actions
    { name: 'room:create', subject: 'Room', action: 'create', screen: 'screen:room' },
    { name: 'room:read', subject: 'Room', action: 'read', screen: 'screen:room' },
    { name: 'room:update', subject: 'Room', action: 'update', screen: 'screen:room' },
    { name: 'room:delete', subject: 'Room', action: 'delete', screen: 'screen:room' },
    { name: 'room:updateStatus', subject: 'Room', action: 'updateStatus', screen: 'screen:room' },

    // Customer actions
    { name: 'customer:create', subject: 'Customer', action: 'create', screen: 'screen:customer' },
    { name: 'customer:read', subject: 'Customer', action: 'read', screen: 'screen:customer' },
    { name: 'customer:update', subject: 'Customer', action: 'update', screen: 'screen:customer' },
    { name: 'customer:delete', subject: 'Customer', action: 'delete', screen: 'screen:customer' },

    // Employee actions
    { name: 'employee:create', subject: 'Employee', action: 'create', screen: 'screen:employee' },
    { name: 'employee:read', subject: 'Employee', action: 'read', screen: 'screen:employee' },
    { name: 'employee:update', subject: 'Employee', action: 'update', screen: 'screen:employee' },
    { name: 'employee:delete', subject: 'Employee', action: 'delete', screen: 'screen:employee' },

    // Service actions
    { name: 'service:create', subject: 'Service', action: 'create', screen: 'screen:service' },
    { name: 'service:read', subject: 'Service', action: 'read', screen: 'screen:service' },
    { name: 'service:update', subject: 'Service', action: 'update', screen: 'screen:service' },
    { name: 'service:delete', subject: 'Service', action: 'delete', screen: 'screen:service' },

    // Transaction actions
    {
      name: 'transaction:create',
      subject: 'Transaction',
      action: 'create',
      screen: 'screen:transaction'
    },
    {
      name: 'transaction:read',
      subject: 'Transaction',
      action: 'read',
      screen: 'screen:transaction'
    },
    {
      name: 'transaction:refund',
      subject: 'Transaction',
      action: 'refund',
      screen: 'screen:transaction'
    },

    // Report actions
    { name: 'report:view', subject: 'Report', action: 'view', screen: 'screen:report' },
    { name: 'report:export', subject: 'Report', action: 'export', screen: 'screen:report' },

    // Settings actions
    { name: 'settings:read', subject: 'Settings', action: 'read', screen: 'screen:settings' },
    { name: 'settings:update', subject: 'Settings', action: 'update', screen: 'screen:settings' },

    // Role actions
    { name: 'role:create', subject: 'Role', action: 'create', screen: 'screen:role' },
    { name: 'role:read', subject: 'Role', action: 'read', screen: 'screen:role' },
    { name: 'role:update', subject: 'Role', action: 'update', screen: 'screen:role' },
    { name: 'role:delete', subject: 'Role', action: 'delete', screen: 'screen:role' },

    // Customer Rank actions
    { name: 'rank:create', subject: 'CustomerRank', action: 'create', screen: 'screen:rank' },
    { name: 'rank:read', subject: 'CustomerRank', action: 'read', screen: 'screen:rank' },
    { name: 'rank:update', subject: 'CustomerRank', action: 'update', screen: 'screen:rank' },
    { name: 'rank:delete', subject: 'CustomerRank', action: 'delete', screen: 'screen:rank' }
  ]
};

// Role definitions
const ROLES = [
  {
    name: 'ADMIN',
    description: 'Full system access - can manage everything',
    screens: PERMISSIONS.screens.map((s) => s.name),
    actions: PERMISSIONS.actions.map((a) => a.name)
  },
  {
    name: 'RECEPTIONIST',
    description: 'Front desk operations - bookings, customers, transactions',
    screens: [
      'screen:dashboard',
      'screen:booking',
      'screen:room',
      'screen:customer',
      'screen:service',
      'screen:transaction',
      'screen:report'
    ],
    actions: [
      // Booking
      'booking:create',
      'booking:read',
      'booking:update',
      'booking:checkIn',
      'booking:checkOut',
      'booking:cancel',
      // Room
      'room:read',
      'room:updateStatus',
      // Customer
      'customer:create',
      'customer:read',
      'customer:update',
      // Service
      'service:read',
      // Transaction
      'transaction:create',
      'transaction:read',
      // Report
      'report:view'
    ]
  },
  {
    name: 'HOUSEKEEPING',
    description: 'Room maintenance and cleaning',
    screens: ['screen:dashboard', 'screen:room', 'screen:booking'],
    actions: ['room:read', 'room:updateStatus', 'booking:read']
  },
  {
    name: 'STAFF',
    description: 'General staff with view-only access',
    screens: ['screen:dashboard', 'screen:booking', 'screen:room'],
    actions: ['booking:read', 'room:read', 'customer:read', 'service:read']
  }
];

export async function seedRBAC(prisma: PrismaClient) {
  console.log('Seeding RBAC data...\n');

  // 1. Create screen permissions
  console.log('Creating screen permissions...');
  const screenMap = new Map<string, string>();

  for (const screen of PERMISSIONS.screens) {
    const perm = await prisma.permission.upsert({
      where: { name: screen.name },
      update: {
        subject: screen.subject,
        action: screen.action,
        description: screen.description
      },
      create: {
        name: screen.name,
        type: PermissionType.SCREEN,
        subject: screen.subject,
        action: screen.action,
        description: screen.description
      }
    });
    screenMap.set(screen.name, perm.id);
    console.log(`   ✓ ${screen.name}`);
  }

  // 2. Create action permissions
  console.log('\n Creating action permissions...');
  for (const action of PERMISSIONS.actions) {
    const parentId = screenMap.get(action.screen);
    await prisma.permission.upsert({
      where: { name: action.name },
      update: {
        subject: action.subject,
        action: action.action,
        parentId
      },
      create: {
        name: action.name,
        type: PermissionType.ACTION,
        subject: action.subject,
        action: action.action,
        description: `Can ${action.action} ${action.subject}`,
        parentId
      }
    });
    console.log(`   ✓ ${action.name}`);
  }

  // 3. Create roles with permissions
  console.log('\n Creating roles...');
  for (const roleData of ROLES) {
    const { screens, actions, ...roleInfo } = roleData;
    const allPermissionNames = [...screens, ...actions];

    // Create or update role
    const role = await prisma.role.upsert({
      where: { name: roleInfo.name },
      update: { description: roleInfo.description },
      create: {
        name: roleInfo.name,
        description: roleInfo.description
      }
    });

    // Get all permission IDs
    const permissions = await prisma.permission.findMany({
      where: { name: { in: allPermissionNames } }
    });

    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    // Create new role permissions
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: role.id,
        permissionId: p.id
      }))
    });

    console.log(`   ✓ ${role.name}: ${screens.length} screens, ${actions.length} actions`);
  }

  // 4. Note: Role assignment to employees should be done after employees are seeded
  // or manually in employee.seed.ts

  console.log('\n RBAC seeding complete!\n');
}

export default seedRBAC;

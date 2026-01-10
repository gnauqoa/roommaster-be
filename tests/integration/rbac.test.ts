/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RBAC (Role-Based Access Control) Integration Test
 *
 * This test validates the RBAC system including:
 * - Role and permission management
 * - CASL ability generation
 * - Permission checking for screens and actions
 *
 * Run with: yarn test tests/integration/rbac.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient, PermissionType } from '@prisma/client';
import { container, TOKENS } from '@/core/container';
import { bootstrap } from '@/core/bootstrap';
import { CaslService } from '@/services/casl.service';
import { defineAbilitiesFor, buildAbilitiesFromPermissions } from '@/config/casl-ability';

const prisma = new PrismaClient();

describe('RBAC Integration Test', () => {
  let caslService: CaslService;

  // Test data IDs for cleanup
  let testRoleId: string | null = null;
  const testPermissionIds: string[] = [];
  let existingAdminRoleId: string | null = null;

  beforeAll(async () => {
    // Bootstrap the DI container
    await bootstrap();

    // Initialize service from container
    caslService = container.resolve<CaslService>(TOKENS.CaslService);

    // Get existing ADMIN role for some tests
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    existingAdminRoleId = adminRole?.id || null;
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function cleanupTestData() {
    // Delete test role permissions first (cascade should handle this, but be explicit)
    if (testRoleId) {
      await prisma.rolePermission
        .deleteMany({
          where: { roleId: testRoleId }
        })
        .catch(() => {
          // Ignore cleanup errors
        });

      await prisma.role
        .delete({
          where: { id: testRoleId }
        })
        .catch(() => {
          // Ignore cleanup errors
        });
    }

    // Delete test permissions
    if (testPermissionIds.length > 0) {
      await prisma.permission
        .deleteMany({
          where: { id: { in: testPermissionIds } }
        })
        .catch(() => {
          // Ignore cleanup errors
        });
    }
  }

  describe('Role Management', () => {
    it('should create a new role', async () => {
      const role = await prisma.role.create({
        data: {
          name: `TEST_ROLE_${Date.now()}`,
          description: 'Test role for RBAC integration tests',
          isActive: true
        }
      });

      testRoleId = role.id;

      expect(role).toHaveProperty('id');
      expect(role.name).toContain('TEST_ROLE');
      expect(role.isActive).toBe(true);

      console.log(`✅ Role created: ${role.name}`);
    });

    it('should get all roles with permission counts', async () => {
      const roles = await caslService.getAllRoles();

      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);

      // Each role should have _count property
      roles.forEach((role) => {
        expect(role).toHaveProperty('_count');
        expect(role._count).toHaveProperty('permissions');
        expect(role._count).toHaveProperty('employees');
      });

      console.log(`✅ Found ${roles.length} roles`);
    });
  });

  describe('Permission Management', () => {
    it('should create screen and action permissions', async () => {
      // Create a screen permission
      const screenPermission = await prisma.permission.create({
        data: {
          name: `test:screen:${Date.now()}`,
          type: PermissionType.SCREEN,
          subject: 'TestResource',
          action: 'access',
          description: 'Test screen permission'
        }
      });
      testPermissionIds.push(screenPermission.id);

      // Create action permissions
      const createPermission = await prisma.permission.create({
        data: {
          name: `test:create:${Date.now()}`,
          type: PermissionType.ACTION,
          subject: 'TestResource',
          action: 'create',
          description: 'Test create permission'
        }
      });
      testPermissionIds.push(createPermission.id);

      const readPermission = await prisma.permission.create({
        data: {
          name: `test:read:${Date.now()}`,
          type: PermissionType.ACTION,
          subject: 'TestResource',
          action: 'read',
          description: 'Test read permission'
        }
      });
      testPermissionIds.push(readPermission.id);

      expect(screenPermission.type).toBe(PermissionType.SCREEN);
      expect(createPermission.type).toBe(PermissionType.ACTION);
      expect(readPermission.action).toBe('read');

      console.log(`✅ Created ${testPermissionIds.length} test permissions`);
    });

    it('should assign permissions to a role', async () => {
      expect(testRoleId).not.toBeNull();
      expect(testPermissionIds.length).toBeGreaterThan(0);

      // Assign all test permissions to the test role
      const rolePermissions = await Promise.all(
        testPermissionIds.map((permissionId) =>
          prisma.rolePermission.create({
            data: {
              roleId: testRoleId!,
              permissionId
            }
          })
        )
      );

      expect(rolePermissions).toHaveLength(testPermissionIds.length);

      // Verify role has permissions
      const roleWithPermissions = await caslService.getRoleWithPermissions(testRoleId!);
      expect(roleWithPermissions).not.toBeNull();
      expect(roleWithPermissions!.permissions.length).toBe(testPermissionIds.length);

      console.log(`✅ Assigned ${testPermissionIds.length} permissions to role`);
    });
  });

  describe('CASL Ability Generation', () => {
    it('should generate abilities for ADMIN role with manage all', async () => {
      if (!existingAdminRoleId) {
        console.log('⚠️ Skipping: ADMIN role not found');
        return;
      }

      const ability = await defineAbilitiesFor(existingAdminRoleId, prisma);

      // ADMIN should be able to do everything
      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('create', 'Booking')).toBe(true);
      expect(ability.can('delete', 'Employee')).toBe(true);
      expect(ability.can('access', 'Settings')).toBe(true);

      console.log('✅ ADMIN role has manage all abilities');
    });

    it('should generate limited abilities for test role', async () => {
      expect(testRoleId).not.toBeNull();

      const ability = await defineAbilitiesFor(testRoleId!, prisma);

      // Test role should have only assigned permissions
      expect(ability.can('access', 'TestResource' as any)).toBe(true);
      expect(ability.can('create', 'TestResource' as any)).toBe(true);
      expect(ability.can('read', 'TestResource' as any)).toBe(true);

      // Should NOT have permissions not assigned
      expect(ability.can('delete', 'TestResource' as any)).toBe(false);
      expect(ability.can('access', 'Settings')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);

      console.log('✅ Test role has limited abilities as expected');
    });

    it('should return empty abilities for non-existent role', async () => {
      const ability = await defineAbilitiesFor('non-existent-role-id', prisma);

      // Should not have any abilities
      expect(ability.can('read', 'Booking')).toBe(false);
      expect(ability.can('access', 'Dashboard')).toBe(false);

      console.log('✅ Non-existent role returns empty abilities');
    });

    it('should build abilities from permission array', () => {
      const permissions = [
        { action: 'read', subject: 'Booking' },
        { action: 'create', subject: 'Booking' },
        { action: 'access', subject: 'Dashboard' }
      ];

      const ability = buildAbilitiesFromPermissions(permissions);

      expect(ability.can('read', 'Booking')).toBe(true);
      expect(ability.can('create', 'Booking')).toBe(true);
      expect(ability.can('access', 'Dashboard')).toBe(true);
      expect(ability.can('delete', 'Booking')).toBe(false);

      console.log('✅ Built abilities from permission array');
    });
  });

  describe('CaslService Permission Checking', () => {
    it('should get formatted permissions for a role', async () => {
      expect(testRoleId).not.toBeNull();

      const permissions = await caslService.getPermissionsForRole(testRoleId!);

      expect(permissions).not.toBeNull();
      expect(permissions!.role).toHaveProperty('id', testRoleId);
      expect(permissions!.role).toHaveProperty('name');

      // Should have screens and actions separated
      expect(Array.isArray(permissions!.screens)).toBe(true);
      expect(Array.isArray(permissions!.actions)).toBe(true);
      expect(Array.isArray(permissions!.permissions)).toBe(true);

      // Screens should have correct structure
      permissions!.screens.forEach((screen) => {
        expect(screen).toHaveProperty('name');
        expect(screen).toHaveProperty('subject');
      });

      console.log(
        `✅ Got permissions: ${permissions!.screens.length} screens, ${
          permissions!.actions.length
        } actions`
      );
    });

    it('should return null for non-existent role', async () => {
      const permissions = await caslService.getPermissionsForRole('non-existent-id');

      expect(permissions).toBeNull();
    });

    it('should check screen access correctly', async () => {
      expect(testRoleId).not.toBeNull();

      // Test role should have access to TestResource screen
      const canAccess = await caslService.canAccessScreen(testRoleId!, 'TestResource');
      expect(canAccess).toBe(true);

      // Test role should NOT have access to Settings screen
      const cannotAccess = await caslService.canAccessScreen(testRoleId!, 'Settings');
      expect(cannotAccess).toBe(false);

      console.log('✅ Screen access checks work correctly');
    });

    it('should check action permissions correctly', async () => {
      expect(testRoleId).not.toBeNull();

      // Test role can create and read TestResource
      expect(await caslService.canPerformAction(testRoleId!, 'create', 'TestResource')).toBe(true);
      expect(await caslService.canPerformAction(testRoleId!, 'read', 'TestResource')).toBe(true);

      // Test role cannot delete TestResource or access other resources
      expect(await caslService.canPerformAction(testRoleId!, 'delete', 'TestResource')).toBe(false);
      expect(await caslService.canPerformAction(testRoleId!, 'create', 'Booking')).toBe(false);

      console.log('✅ Action permission checks work correctly');
    });
  });

  describe('Role Deactivation', () => {
    it('should return empty abilities for inactive role', async () => {
      expect(testRoleId).not.toBeNull();

      // Deactivate the test role
      await prisma.role.update({
        where: { id: testRoleId! },
        data: { isActive: false }
      });

      const ability = await defineAbilitiesFor(testRoleId!, prisma);

      // Inactive role should have no abilities
      expect(ability.can('access', 'TestResource' as any)).toBe(false);
      expect(ability.can('create', 'TestResource' as any)).toBe(false);

      // Reactivate for other tests
      await prisma.role.update({
        where: { id: testRoleId! },
        data: { isActive: true }
      });

      console.log('✅ Inactive role returns empty abilities');
    });
  });
});

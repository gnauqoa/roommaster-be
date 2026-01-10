/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { CaslService } from '@/services/casl.service';
import { PermissionType } from '@prisma/client';

// Mock the casl-ability module
jest.mock('@/config/casl-ability', () => ({
  defineAbilitiesFor: jest.fn(),
  buildAbilitiesFromPermissions: jest.fn()
}));

// Import after mocking
import { defineAbilitiesFor } from '@/config/casl-ability';

const mockDefineAbilitiesFor = defineAbilitiesFor as jest.MockedFunction<typeof defineAbilitiesFor>;

// Create mock prisma client
const createMockPrisma = () => ({
  role: {
    findUnique: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>
  }
});

describe('CaslService', () => {
  let caslService: CaslService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    caslService = new CaslService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('getAbilityForRole', () => {
    it('should call defineAbilitiesFor with correct parameters', async () => {
      const roleId = 'role-123';
      const mockAbility = { can: jest.fn() };
      mockDefineAbilitiesFor.mockResolvedValue(mockAbility as any);

      const result = await caslService.getAbilityForRole(roleId);

      expect(defineAbilitiesFor).toHaveBeenCalledWith(roleId, mockPrisma);
      expect(result).toBe(mockAbility);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return null if role not found', async () => {
      const roleId = 'non-existent-role';
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const result = await caslService.getPermissionsForRole(roleId);

      expect(result).toBeNull();
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should return formatted permissions for a valid role', async () => {
      const roleId = 'role-123';
      const mockRole = {
        id: roleId,
        name: 'RECEPTIONIST',
        description: 'Front desk staff',
        permissions: [
          {
            permission: {
              id: 'perm-1',
              name: 'screen:booking',
              type: PermissionType.SCREEN,
              subject: 'Booking',
              action: 'access',
              description: 'Access booking screen'
            }
          },
          {
            permission: {
              id: 'perm-2',
              name: 'booking:create',
              type: PermissionType.ACTION,
              subject: 'Booking',
              action: 'create',
              description: 'Create bookings'
            }
          },
          {
            permission: {
              id: 'perm-3',
              name: 'booking:read',
              type: PermissionType.ACTION,
              subject: 'Booking',
              action: 'read',
              description: 'Read bookings'
            }
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await caslService.getPermissionsForRole(roleId);

      expect(result).not.toBeNull();
      expect(result!.role).toEqual({
        id: roleId,
        name: 'RECEPTIONIST',
        description: 'Front desk staff'
      });
      expect(result!.screens).toHaveLength(1);
      expect(result!.screens[0]).toEqual({
        name: 'screen:booking',
        subject: 'Booking',
        description: 'Access booking screen'
      });
      expect(result!.actions).toHaveLength(2);
      expect(result!.actions).toContain('booking:create');
      expect(result!.actions).toContain('booking:read');
      expect(result!.permissions).toHaveLength(3);
      expect(result!.permissions).toContainEqual({ action: 'access', subject: 'Booking' });
      expect(result!.permissions).toContainEqual({ action: 'create', subject: 'Booking' });
    });

    it('should handle role with no permissions', async () => {
      const roleId = 'role-empty';
      const mockRole = {
        id: roleId,
        name: 'NEW_ROLE',
        description: null,
        permissions: []
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await caslService.getPermissionsForRole(roleId);

      expect(result).not.toBeNull();
      expect(result!.screens).toHaveLength(0);
      expect(result!.actions).toHaveLength(0);
      expect(result!.permissions).toHaveLength(0);
    });
  });

  describe('canAccessScreen', () => {
    it('should return true when role can access screen', async () => {
      const roleId = 'role-123';
      const screenSubject = 'Booking';
      const mockAbility = { can: jest.fn().mockReturnValue(true) };
      mockDefineAbilitiesFor.mockResolvedValue(mockAbility as any);

      const result = await caslService.canAccessScreen(roleId, screenSubject);

      expect(result).toBe(true);
      expect(mockAbility.can).toHaveBeenCalledWith('access', screenSubject);
    });

    it('should return false when role cannot access screen', async () => {
      const roleId = 'role-123';
      const screenSubject = 'Settings';
      const mockAbility = { can: jest.fn().mockReturnValue(false) };
      mockDefineAbilitiesFor.mockResolvedValue(mockAbility as any);

      const result = await caslService.canAccessScreen(roleId, screenSubject);

      expect(result).toBe(false);
      expect(mockAbility.can).toHaveBeenCalledWith('access', screenSubject);
    });
  });

  describe('canPerformAction', () => {
    it('should return true when role can perform action', async () => {
      const roleId = 'role-123';
      const action = 'create';
      const subject = 'Booking';
      const mockAbility = { can: jest.fn().mockReturnValue(true) };
      mockDefineAbilitiesFor.mockResolvedValue(mockAbility as any);

      const result = await caslService.canPerformAction(roleId, action, subject);

      expect(result).toBe(true);
      expect(mockAbility.can).toHaveBeenCalledWith(action, subject);
    });

    it('should return false when role cannot perform action', async () => {
      const roleId = 'role-123';
      const action = 'delete';
      const subject = 'Employee';
      const mockAbility = { can: jest.fn().mockReturnValue(false) };
      mockDefineAbilitiesFor.mockResolvedValue(mockAbility as any);

      const result = await caslService.canPerformAction(roleId, action, subject);

      expect(result).toBe(false);
      expect(mockAbility.can).toHaveBeenCalledWith(action, subject);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles with permission and employee counts', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'ADMIN',
          description: 'Administrator',
          isActive: true,
          _count: { permissions: 50, employees: 2 }
        },
        {
          id: 'role-2',
          name: 'RECEPTIONIST',
          description: 'Front desk',
          isActive: true,
          _count: { permissions: 20, employees: 5 }
        }
      ];

      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await caslService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { permissions: true, employees: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    });

    it('should return empty array when no roles exist', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);

      const result = await caslService.getAllRoles();

      expect(result).toEqual([]);
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should return role with all permissions', async () => {
      const roleId = 'role-123';
      const mockRole = {
        id: roleId,
        name: 'RECEPTIONIST',
        description: 'Front desk staff',
        isActive: true,
        permissions: [
          {
            id: 'rp-1',
            roleId,
            permissionId: 'perm-1',
            permission: {
              id: 'perm-1',
              name: 'booking:create',
              type: PermissionType.ACTION,
              subject: 'Booking',
              action: 'create'
            }
          }
        ]
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await caslService.getRoleWithPermissions(roleId);

      expect(result).toEqual(mockRole);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should return null for non-existent role', async () => {
      const roleId = 'non-existent';
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const result = await caslService.getRoleWithPermissions(roleId);

      expect(result).toBeNull();
    });
  });
});

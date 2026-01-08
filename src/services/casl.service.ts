import { PrismaClient, PermissionType } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import {
  AppAbility,
  defineAbilitiesFor,
  buildAbilitiesFromPermissions,
  CaslPermission
} from '@/config/casl-ability';

/**
 * Response structure for permissions endpoint
 */
export interface PermissionResponse {
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  screens: Array<{
    name: string;
    subject: string;
    description: string | null;
  }>;
  actions: string[];
  permissions: CaslPermission[]; // Raw permissions for frontend CASL
}

@Injectable()
export class CaslService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get CASL ability instance for a role
   * @param roleId - Role ID to get abilities for
   * @returns CASL ability instance
   */
  async getAbilityForRole(roleId: string): Promise<AppAbility> {
    return defineAbilitiesFor(roleId, this.prisma);
  }

  /**
   * Get permissions for a role
   * Returns screens for sidebar menu and actions for button visibility
   * @param roleId - Role ID to get permissions for
   */
  async getPermissionsForRole(roleId: string): Promise<PermissionResponse | null> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) return null;

    const permissions = role.permissions.map((rp) => rp.permission);

    // Separate screens and actions
    const screens = permissions
      .filter((p) => p.type === PermissionType.SCREEN)
      .map((p) => ({
        name: p.name,
        subject: p.subject,
        description: p.description
      }));

    const actions = permissions.filter((p) => p.type === PermissionType.ACTION).map((p) => p.name);

    // Raw permissions for frontend CASL instance
    const rawPermissions: CaslPermission[] = permissions.map((p) => ({
      action: p.action,
      subject: p.subject
    }));

    return {
      role: {
        id: role.id,
        name: role.name,
        description: role.description
      },
      screens,
      actions,
      permissions: rawPermissions
    };
  }

  /**
   * Check if a role can access a specific screen
   * @param roleId - Role ID
   * @param screenSubject - Screen subject (e.g., 'Booking', 'Room')
   */
  async canAccessScreen(roleId: string, screenSubject: string): Promise<boolean> {
    const ability = await this.getAbilityForRole(roleId);
    return ability.can('access', screenSubject as any);
  }

  /**
   * Check if a role can perform a specific action
   * @param roleId - Role ID
   * @param action - Action to check (e.g., 'create', 'read')
   * @param subject - Subject to check (e.g., 'Booking', 'Room')
   */
  async canPerformAction(roleId: string, action: string, subject: string): Promise<boolean> {
    const ability = await this.getAbilityForRole(roleId);
    return ability.can(action as any, subject as any);
  }

  /**
   * Get all roles with their permission counts
   * admin role management
   */
  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: { permissions: true, employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get a role with all its permissions
   * @param roleId - Role ID
   */
  async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }
}

export default CaslService;

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { PrismaClient } from '@prisma/client';

/**
 * All possible actions in the system
 * - 'access' is used for screen-level permissions
 * - CRUD actions for resource-level permissions
 * - Custom actions 'checkIn', 'checkOut' for specific operations
 */
type Actions =
  | 'access' // Screen access
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'checkIn'
  | 'checkOut'
  | 'cancel'
  | 'updateStatus'
  | 'refund'
  | 'view'
  | 'export'
  | 'approve'
  | 'manage'; // Special: grants all actions

/**
 * All subjects (resources) in the system
 * Must match the 'subject' field in Permission table
 */
type Subjects =
  | 'Dashboard'
  | 'Booking'
  | 'Room'
  | 'Customer'
  | 'Employee'
  | 'Service'
  | 'Transaction'
  | 'Report'
  | 'Settings'
  | 'Role'
  | 'CustomerRank'
  | 'Promotion'
  | 'PricingRule'
  | 'Activity'
  | 'all'; // Special: grants access to all subjects

/**
 * CASL Ability type for the application
 */
export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Permission structure for frontend
 */
export interface CaslPermission {
  action: string;
  subject: string;
}

/**
 * Build CASL abilities from database permissions
 * @param roleId - The role ID to load permissions for
 * @param prisma - Prisma client instance
 * @returns CASL ability instance
 */
export async function defineAbilitiesFor(
  roleId: string,
  prisma: PrismaClient
): Promise<AppAbility> {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // Fetch role with permissions from database
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  // Return empty abilities if role not found or inactive
  if (!role || !role.isActive) {
    return build();
  }

  // Special case: ADMIN role gets full access
  if (role.name === 'ADMIN') {
    can('manage', 'all');
    return build();
  }

  // Build abilities from permissions stored in database
  for (const rolePermission of role.permissions) {
    const { action, subject } = rolePermission.permission;
    can(action as Actions, subject as Subjects);
  }

  return build();
}

/**
 * Build abilities from a permission array (useful for caching or frontend)
 * @param permissions - Array of permission objects
 * @returns CASL ability instance
 */
export function buildAbilitiesFromPermissions(permissions: CaslPermission[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const perm of permissions) {
    can(perm.action as Actions, perm.subject as Subjects);
  }

  return build();
}

/**
 * Check if ability allows access to a screen
 * @param ability - CASL ability instance
 * @param subject - Screen subject name
 */
export function canAccessScreen(ability: AppAbility, subject: Subjects): boolean {
  return ability.can('access', subject);
}

/**
 * Check if ability allows an action on a subject
 * @param ability - CASL ability instance
 * @param action - Action to check
 * @param subject - Subject to check against
 */
export function canPerformAction(ability: AppAbility, action: Actions, subject: Subjects): boolean {
  return ability.can(action, subject);
}

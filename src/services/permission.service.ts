import { PrismaClient, Permission, Prisma, PermissionType } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

export interface PermissionFilters {
  search?: string;
  type?: PermissionType;
  subject?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get all permissions with filters and pagination
   * @param {PermissionFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: any[]; total: number; page: number; limit: number }>}
   */
  async getAllPermissions(
    filters: PermissionFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { search, type, subject } = filters;
    const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = options;

    const where: Prisma.PermissionWhereInput = {};

    // Apply search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Apply type filter
    if (type) {
      where.type = type;
    }

    // Apply subject filter
    if (subject) {
      where.subject = {
        contains: subject,
        mode: 'insensitive'
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              children: true,
              roles: true
            }
          }
        }
      }),
      this.prisma.permission.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get permission by ID
   * @param {string} permissionId - Permission ID
   * @returns {Promise<any>} Permission
   */
  async getPermissionById(permissionId: string): Promise<any> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
            subject: true,
            action: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            subject: true,
            action: true
          }
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!permission) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Permission not found');
    }

    return permission;
  }

  /**
   * Get permissions grouped by subject
   * @returns {Promise<any>} Permissions grouped by subject
   */
  async getPermissionsGroupedBySubject(): Promise<any> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ subject: 'asc' }, { type: 'asc' }, { action: 'asc' }],
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Group by subject
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.subject]) {
        acc[permission.subject] = {
          subject: permission.subject,
          screens: [],
          actions: []
        };
      }

      if (permission.type === PermissionType.SCREEN) {
        acc[permission.subject].screens.push(permission);
      } else {
        acc[permission.subject].actions.push(permission);
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }

  /**
   * Get all screen permissions
   * @returns {Promise<Permission[]>} List of screen permissions
   */
  async getScreenPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { type: PermissionType.SCREEN },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get all action permissions
   * @returns {Promise<Permission[]>} List of action permissions
   */
  async getActionPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { type: PermissionType.ACTION },
      orderBy: { name: 'asc' },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }
}

export default PermissionService;

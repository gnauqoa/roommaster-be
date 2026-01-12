import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new role
   * @param {CreateRoleData} roleData - Role data
   * @returns {Promise<Role>} Created role
   */
  async createRole(roleData: CreateRoleData): Promise<any> {
    // Check if role name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: roleData.name }
    });

    if (existingRole) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Role name already exists');
    }

    // Validate permissions if provided
    if (roleData.permissionIds && roleData.permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: roleData.permissionIds } }
      });

      if (permissions.length !== roleData.permissionIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more permissions not found');
      }
    }

    // Create role
    const role = await this.prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissionIds
          ? {
              createMany: {
                data: roleData.permissionIds.map((permissionId) => ({
                  permissionId
                }))
              }
            }
          : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return role;
  }

  /**
   * Get all roles with filters and pagination
   * @param {RoleFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: any[]; total: number; page: number; limit: number }>}
   */
  async getAllRoles(
    filters: RoleFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { search, isActive } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: Prisma.RoleWhereInput = {};

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

    // Apply isActive filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  subject: true,
                  action: true
                }
              }
            }
          },
          _count: {
            select: {
              employees: true,
              permissions: true
            }
          }
        }
      }),
      this.prisma.role.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get role by ID
   * @param {string} roleId - Role ID
   * @returns {Promise<any>} Role with permissions
   */
  async getRoleById(roleId: string): Promise<any> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                type: true,
                subject: true,
                action: true,
                description: true
              }
            }
          }
        },
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    if (!role) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }

    return role;
  }

  /**
   * Update role by ID
   * @param {string} roleId - Role ID
   * @param {UpdateRoleData} updateData - Update data
   * @returns {Promise<any>} Updated role
   */
  async updateRole(roleId: string, updateData: UpdateRoleData): Promise<any> {
    await this.getRoleById(roleId);

    // Check if new name already exists
    if (updateData.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: {
          name: updateData.name,
          id: { not: roleId }
        }
      });

      if (existingRole) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role name already exists');
      }
    }

    // Validate permissions if provided
    if (updateData.permissionIds && updateData.permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: updateData.permissionIds } }
      });

      if (permissions.length !== updateData.permissionIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more permissions not found');
      }
    }

    const { permissionIds, ...roleUpdateData } = updateData;

    // Update role and permissions in a transaction
    const updatedRole = await this.prisma.$transaction(async (tx) => {
      // Update role basic info
      await tx.role.update({
        where: { id: roleId },
        data: roleUpdateData
      });

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId }
        });

        // Create new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId,
              permissionId
            }))
          });
        }
      }

      // Return updated role with permissions
      return tx.role.findUnique({
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

    return updatedRole;
  }

  /**
   * Delete role by ID
   * @param {string} roleId - Role ID
   * @returns {Promise<void>}
   */
  async deleteRole(roleId: string): Promise<void> {
    await this.getRoleById(roleId);

    // Check if role has employees
    const employeeCount = await this.prisma.employee.count({
      where: { roleId }
    });

    if (employeeCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot delete role with ${employeeCount} employee(s). Reassign employees first.`
      );
    }

    // Delete role (RolePermission will be deleted by CASCADE)
    await this.prisma.role.delete({
      where: { id: roleId }
    });
  }

  /**
   * Get role permissions
   * @param {string} roleId - Role ID
   * @returns {Promise<any[]>} List of permissions
   */
  async getRolePermissions(roleId: string): Promise<any[]> {
    await this.getRoleById(roleId);

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: {
          select: {
            id: true,
            name: true,
            type: true,
            subject: true,
            action: true,
            description: true,
            parentId: true
          }
        }
      }
    });

    return rolePermissions.map((rp) => rp.permission);
  }
}

export default RoleService;

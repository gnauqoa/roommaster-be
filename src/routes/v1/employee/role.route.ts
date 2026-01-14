import express from 'express';
import { authEmployee } from '@/middlewares/auth';
import validate from '@/middlewares/validate';
import roleValidation from '@/validations/role.validation';
import { container, TOKENS } from '@/core/container';
import { RoleService } from '@/services';
import { RoleController } from '@/controllers/employee/employee.role.controller';

export default function createRoleRoutes(): express.Router {
  const roleRoute = express.Router();

  // Manually instantiate controller with dependencies
  const roleService = container.resolve<RoleService>(TOKENS.RoleService);
  const roleController = new RoleController(roleService);

  /**
   * @swagger
   * tags:
   *   name: Roles
   *   description: Role management endpoints
   */

  /**
   * @swagger
   * /employee/roles:
   *   post:
   *     summary: Create a new role
   *     description: Create a new role with permissions (admin only)
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 50
   *                 description: Role name
   *               description:
   *                 type: string
   *                 maxLength: 255
   *                 description: Role description
   *               permissionIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of permission IDs to assign to role
   *             example:
   *               name: "MANAGER"
   *               description: "Manager with booking and room access"
   *               permissionIds: ["perm_id_1", "perm_id_2"]
   *     responses:
   *       201:
   *         description: Role created successfully
   *       400:
   *         description: Role name already exists or validation error
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *
   *   get:
   *     summary: Get all roles
   *     description: Retrieve a paginated list of roles with permissions
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name or description
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, description, isActive, createdAt, updatedAt]
   *           default: createdAt
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *     responses:
   *       200:
   *         description: Roles retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roleRoute
    .route('/')
    .post(authEmployee, validate(roleValidation.createRole), roleController.createRole)
    .get(authEmployee, validate(roleValidation.getRoles), roleController.getRoles);

  /**
   * @swagger
   * /employee/roles/{roleId}:
   *   get:
   *     summary: Get role by ID
   *     description: Retrieve a specific role with its permissions
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role retrieved successfully
   *       404:
   *         description: Role not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *
   *   patch:
   *     summary: Update role
   *     description: Update role information and permissions
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 50
   *               description:
   *                 type: string
   *                 maxLength: 255
   *               isActive:
   *                 type: boolean
   *               permissionIds:
   *                 type: array
   *                 items:
   *                   type: string
   *             example:
   *               name: "SENIOR_MANAGER"
   *               description: "Senior manager with full booking access"
   *               isActive: true
   *               permissionIds: ["perm_id_1", "perm_id_2", "perm_id_3"]
   *     responses:
   *       200:
   *         description: Role updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Role not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *
   *   delete:
   *     summary: Delete role
   *     description: Delete a role (only if no employees assigned)
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       204:
   *         description: Role deleted successfully
   *       400:
   *         description: Cannot delete role with employees
   *       404:
   *         description: Role not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roleRoute
    .route('/:roleId')
    .get(authEmployee, validate(roleValidation.getRole), roleController.getRole)
    .patch(authEmployee, validate(roleValidation.updateRole), roleController.updateRole)
    .delete(authEmployee, validate(roleValidation.deleteRole), roleController.deleteRole);

  /**
   * @swagger
   * /employee/roles/{roleId}/permissions:
   *   get:
   *     summary: Get role permissions
   *     description: Retrieve all permissions assigned to a role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Permissions retrieved successfully
   *       404:
   *         description: Role not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roleRoute
    .route('/:roleId/permissions')
    .get(
      authEmployee,
      validate(roleValidation.getRolePermissions),
      roleController.getRolePermissions
    );

  return roleRoute;
}

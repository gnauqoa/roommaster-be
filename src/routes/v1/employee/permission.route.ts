import express from 'express';
import { authEmployee } from '@/middlewares/auth';
import validate from '@/middlewares/validate';
import permissionValidation from '@/validations/permission.validation';
import { container, TOKENS } from '@/core/container';
import { PermissionService } from '@/services';
import { PermissionController } from '@/controllers/employee/permission.controller';

export default function createPermissionRoutes(): express.Router {
  const permissionRoute = express.Router();

  // Manually instantiate controller with dependencies
  const permissionService = container.resolve<PermissionService>(TOKENS.PermissionService);
  const permissionController = new PermissionController(permissionService);

  /**
   * @swagger
   * tags:
   *   name: Permissions
   *   description: Permission management endpoints
   */

  /**
   * @swagger
   * /employee/permissions:
   *   get:
   *     summary: Get all permissions
   *     description: Retrieve a list of permissions with filters
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name or description
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [SCREEN, ACTION]
   *         description: Filter by permission type
   *       - in: query
   *         name: subject
   *         schema:
   *           type: string
   *         description: Filter by subject (e.g., Booking, Room)
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
   *           maximum: 500
   *           default: 100
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, type, subject, action, createdAt, updatedAt]
   *           default: name
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *     responses:
   *       200:
   *         description: Permissions retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  permissionRoute
    .route('/')
    .get(
      authEmployee,
      validate(permissionValidation.getPermissions),
      permissionController.getPermissions
    );

  /**
   * @swagger
   * /employee/permissions/grouped:
   *   get:
   *     summary: Get permissions grouped by subject
   *     description: Retrieve all permissions organized by subject with screens and actions
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Grouped permissions retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  permissionRoute.route('/grouped').get(authEmployee, permissionController.getPermissionsGrouped);

  /**
   * @swagger
   * /employee/permissions/screens:
   *   get:
   *     summary: Get all screen permissions
   *     description: Retrieve all screen-type permissions
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Screen permissions retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  permissionRoute.route('/screens').get(authEmployee, permissionController.getScreenPermissions);

  /**
   * @swagger
   * /employee/permissions/actions:
   *   get:
   *     summary: Get all action permissions
   *     description: Retrieve all action-type permissions
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Action permissions retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  permissionRoute.route('/actions').get(authEmployee, permissionController.getActionPermissions);

  /**
   * @swagger
   * /employee/permissions/{permissionId}:
   *   get:
   *     summary: Get permission by ID
   *     description: Retrieve a specific permission with its details
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: permissionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Permission ID
   *     responses:
   *       200:
   *         description: Permission retrieved successfully
   *       404:
   *         description: Permission not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  permissionRoute
    .route('/:permissionId')
    .get(
      authEmployee,
      validate(permissionValidation.getPermission),
      permissionController.getPermission
    );

  return permissionRoute;
}

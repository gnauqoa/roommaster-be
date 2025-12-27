import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { employeeValidation, authValidation } from 'validations';
import EmployeeController from 'controllers/employee/employee.controller';
import { container, TOKENS } from 'core/container';
import { AuthService, EmployeeService, TokenService } from 'services';

const router = express.Router();

// Manually instantiate controller with dependencies
const authService = container.resolve<AuthService>(TOKENS.AuthService);
const employeeService = container.resolve<EmployeeService>(TOKENS.EmployeeService);
const tokenService = container.resolve<TokenService>(TOKENS.TokenService);
const employeeController = new EmployeeController(authService, employeeService, tokenService);

/**
 * @swagger
 * tags:
 *   name: Employee Profile
 *   description: Employee profile management endpoints
 */

/**
 * @swagger
 * /employee/profile:
 *   get:
 *     summary: Get employee profile
 *     description: Retrieve the authenticated employee's profile information
 *     tags: [Employee Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [ADMIN, RECEPTIONIST, HOUSEKEEPING, STAFF]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authEmployee, employeeController.getProfile);

/**
 * @swagger
 * /employee/profile:
 *   patch:
 *     summary: Update employee profile
 *     description: Update the authenticated employee's profile information
 *     tags: [Employee Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Employee name
 *             example:
 *               name: Nguyễn Văn Updated
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  '/',
  authEmployee,
  validate(employeeValidation.updateProfile),
  employeeController.updateProfile
);

/**
 * @swagger
 * /employee/profile/change-password:
 *   post:
 *     summary: Change employee password
 *     description: Change the authenticated employee's password
 *     tags: [Employee Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *             example:
 *               currentPassword: password123
 *               newPassword: newPassword456
 *     responses:
 *       204:
 *         description: Password changed successfully
 *       401:
 *         description: Incorrect current password or unauthorized
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/change-password',
  authEmployee,
  validate(authValidation.changePassword),
  employeeController.changePassword
);

export default router;

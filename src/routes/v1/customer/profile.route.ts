import express from 'express';
import { authCustomer } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { customerValidation, authValidation } from 'validations';
import CustomerController from 'controllers/customer/customer.controller';
import { container, TOKENS } from 'core/container';
import { AuthService, CustomerService, TokenService } from 'services';

const router = express.Router();

// Manually instantiate controller with dependencies
const authService = container.resolve<AuthService>(TOKENS.AuthService);
const customerService = container.resolve<CustomerService>(TOKENS.CustomerService);
const tokenService = container.resolve<TokenService>(TOKENS.TokenService);
const customerController = new CustomerController(authService, customerService, tokenService);

/**
 * @swagger
 * tags:
 *   name: Customer Profile
 *   description: Customer profile management endpoints
 */

/**
 * @swagger
 * /customer/profile:
 *   get:
 *     summary: Get customer profile
 *     description: Retrieve the authenticated customer's profile information
 *     tags: [Customer Profile]
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
 *                     fullName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     idNumber:
 *                       type: string
 *                     address:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authCustomer, customerController.getProfile);

/**
 * @swagger
 * /customer/profile:
 *   patch:
 *     summary: Update customer profile
 *     description: Update the authenticated customer's profile information
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Customer full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email
 *               idNumber:
 *                 type: string
 *                 description: ID number (CMND/CCCD)
 *               address:
 *                 type: string
 *                 description: Customer address
 *             example:
 *               fullName: Nguyễn Văn B
 *               email: updated@example.com
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
 *                     fullName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  '/',
  authCustomer,
  validate(customerValidation.updateProfile),
  customerController.updateProfile
);

/**
 * @swagger
 * /customer/profile/change-password:
 *   post:
 *     summary: Change customer password
 *     description: Change the authenticated customer's password
 *     tags: [Customer Profile]
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
  authCustomer,
  validate(authValidation.changePassword),
  customerController.changePassword
);

export default router;

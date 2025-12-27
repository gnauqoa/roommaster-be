import express from 'express';
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
 *   name: Customer Auth
 *   description: Customer authentication endpoints
 */

/**
 * @swagger
 * /customer/auth/register:
 *   post:
 *     summary: Customer registration
 *     description: Register a new customer account
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Customer full name
 *               phone:
 *                 type: string
 *                 description: Customer phone number (unique)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email (optional)
 *               idNumber:
 *                 type: string
 *                 description: ID number (CMND/CCCD)
 *               address:
 *                 type: string
 *                 description: Customer address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Customer password
 *             example:
 *               fullName: Nguyễn Văn A
 *               phone: "0901234567"
 *               email: customer@example.com
 *               password: password123
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access:
 *                           type: object
 *                           properties:
 *                             token:
 *                               type: string
 *                             expires:
 *                               type: string
 *                               format: date-time
 *                         refresh:
 *                           type: object
 *                           properties:
 *                             token:
 *                               type: string
 *                             expires:
 *                               type: string
 *                               format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', validate(customerValidation.register), customerController.register);

/**
 * @swagger
 * /customer/auth/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticate a customer and return access and refresh tokens
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Customer password
 *             example:
 *               phone: "0901234567"
 *               password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                     tokens:
 *                       type: object
 *       401:
 *         description: Incorrect phone or password
 */
router.post('/login', validate(customerValidation.login), customerController.login);

/**
 * @swagger
 * /customer/auth/logout:
 *   post:
 *     summary: Customer logout
 *     description: Logout a customer by invalidating the refresh token
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       204:
 *         description: Logout successful
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/logout', validate(authValidation.logout), customerController.logout);

/**
 * @swagger
 * /customer/auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     description: Generate new access and refresh tokens using a valid refresh token
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  customerController.refreshTokens
);

/**
 * @swagger
 * /customer/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Send a password reset token for the customer
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *             example:
 *               phone: "0901234567"
 *     responses:
 *       200:
 *         description: Reset token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetPasswordToken:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/forgot-password',
  validate(customerValidation.forgotPassword),
  customerController.forgotPassword
);

/**
 * @swagger
 * /customer/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset customer password using a valid reset token
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password
 *             example:
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               password: newPassword123
 *     responses:
 *       204:
 *         description: Password reset successful
 *       401:
 *         description: Invalid or expired reset token
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  customerController.resetPassword
);

export default router;

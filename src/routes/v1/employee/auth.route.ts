import express from 'express';
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
 *   name: Employee Auth
 *   description: Employee authentication endpoints
 */

/**
 * @swagger
 * /employee/auth/login:
 *   post:
 *     summary: Employee login
 *     description: Authenticate an employee and return access and refresh tokens
 *     tags: [Employee Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Employee username
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Employee password
 *             example:
 *               username: admin
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
 *                     employee:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "clq1234567890abcdef"
 *                         name:
 *                           type: string
 *                           example: "Nguyễn Văn Admin"
 *                         username:
 *                           type: string
 *                           example: "admin"
 *                         role:
 *                           type: string
 *                           example: "ADMIN"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
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
 *       401:
 *         description: Incorrect username or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Incorrect username or password
 */
router.post('/login', validate(employeeValidation.login), employeeController.login);

/**
 * @swagger
 * /employee/auth/logout:
 *   post:
 *     summary: Employee logout
 *     description: Logout an employee by invalidating the refresh token
 *     tags: [Employee Auth]
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
 *                 description: Refresh token to invalidate
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       204:
 *         description: Logout successful
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/logout', validate(authValidation.logout), employeeController.logout);

/**
 * @swagger
 * /employee/auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     description: Generate new access and refresh tokens using a valid refresh token
 *     tags: [Employee Auth]
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
 *                 description: Valid refresh token
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  employeeController.refreshTokens
);

/**
 * @swagger
 * /employee/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Generate a password reset token for the employee
 *     tags: [Employee Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Employee username
 *             example:
 *               username: admin
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
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/forgot-password',
  validate(employeeValidation.forgotPassword),
  employeeController.forgotPassword
);

/**
 * @swagger
 * /employee/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset employee password using a valid reset token
 *     tags: [Employee Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from forgot-password endpoint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (minimum 8 characters, must contain letter and number)
 *             example:
 *               password: newPassword123
 *     responses:
 *       204:
 *         description: Password reset successful
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Password reset failed
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  employeeController.resetPassword
);

export default router;

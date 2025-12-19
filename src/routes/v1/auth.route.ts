import express from 'express';
import validate from 'middlewares/validate';
import authValidation from 'validations/auth.validation';
import { getAuthController } from 'core/bootstrap';
import auth from 'middlewares/auth';

const router = express.Router();

// Get controller instance from DI container
const authController = getAuthController();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization endpoints
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@hotel.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       "200":
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/Employee'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       "200":
 *         description: Logout successful
 *       "401":
 *         description: Unauthorized
 */
router.post('/logout', auth(), validate(authValidation.logout), authController.logout);

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
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
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       "200":
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid refresh token
 */
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
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
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newPassword123"
 *     responses:
 *       "200":
 *         description: Password changed successfully
 *       "401":
 *         description: Unauthorized or incorrect current password
 */
router.post(
  '/change-password',
  auth(),
  validate(authValidation.changePassword),
  authController.changePassword
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       "401":
 *         description: Unauthorized
 */
router.get('/me', auth(), authController.getProfile);

export default router;

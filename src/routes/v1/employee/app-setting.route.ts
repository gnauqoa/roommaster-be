import express from 'express';
import { container, TOKENS } from '@/core/container';
import EmployeeAppSettingController from '@/controllers/employee/employee.app-setting.controller';
import validate from '@/middlewares/validate';
import appSettingValidation from '@/validations/app-setting.validation';
import { authEmployee } from '@/middlewares/auth';
import AppSettingService from '@/services/app-setting.service';

const router = express.Router();

const appSettingService = container.resolve<AppSettingService>(TOKENS.AppSettingService);
const employeeAppSettingController = new EmployeeAppSettingController(appSettingService);

/**
 * @swagger
 * tags:
 *   name: Employee App Settings
 *   description: Application settings management endpoints for employees
 */

/**
 * @swagger
 * /employee/app-settings:
 *   get:
 *     summary: Get all app settings
 *     tags: [Employee App Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all app settings
 *       401:
 *         description: Unauthorized
 */
router.get('/', authEmployee, employeeAppSettingController.getConfigs);

/**
 * @swagger
 * /employee/app-settings/checkin-time:
 *   get:
 *     summary: Get check-in time configuration
 *     tags: [Employee App Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in time configuration
 *   put:
 *     summary: Update check-in time configuration
 *     tags: [Employee App Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hour
 *               - minute
 *               - gracePeriodMinutes
 *             properties:
 *               hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               minute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *               gracePeriodMinutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 240
 *     responses:
 *       200:
 *         description: Check-in time updated successfully
 */
router
  .route('/checkin-time')
  .get(authEmployee, employeeAppSettingController.getCheckInTime)
  .put(
    authEmployee,
    validate(appSettingValidation.updateCheckInTime),
    employeeAppSettingController.updateCheckInTime
  );

/**
 * @swagger
 * /employee/app-settings/checkout-time:
 *   get:
 *     summary: Get check-out time configuration
 *     tags: [Employee App Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out time configuration
 *   put:
 *     summary: Update check-out time configuration
 *     tags: [Employee App Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hour
 *               - minute
 *               - gracePeriodMinutes
 *             properties:
 *               hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               minute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *               gracePeriodMinutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 240
 *     responses:
 *       200:
 *         description: Check-out time updated successfully
 */
router
  .route('/checkout-time')
  .get(authEmployee, employeeAppSettingController.getCheckOutTime)
  .put(
    authEmployee,
    validate(appSettingValidation.updateCheckOutTime),
    employeeAppSettingController.updateCheckOutTime
  );

export default router;

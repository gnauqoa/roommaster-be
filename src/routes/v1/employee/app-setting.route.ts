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
 *   name: Employee/Config
 *   description: Configuration management endpoints for employees
 */

/**
 * @swagger
 * /v1/employee/config:
 *   get:
 *     summary: Get all configurations
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all configurations
 *       401:
 *         description: Unauthorized
 */
router.get('/', authEmployee, employeeAppSettingController.getConfigs);

/**
 * @swagger
 * /v1/employee/config/checkin-time:
 *   get:
 *     summary: Get check-in time configuration
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in time configuration
 *   put:
 *     summary: Update check-in time configuration
 *     tags: [Employee/Config]
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
 * /v1/employee/config/checkout-time:
 *   get:
 *     summary: Get check-out time configuration
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out time configuration
 *   put:
 *     summary: Update check-out time configuration
 *     tags: [Employee/Config]
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

/**
 * @swagger
 * /v1/employee/config/early-checkin-fee:
 *   get:
 *     summary: Get early check-in fee configuration
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Early check-in fee configuration
 *   put:
 *     summary: Update early check-in fee configuration
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *               - type
 *               - amount
 *               - applyAfterGracePeriod
 *             properties:
 *               enabled:
 *                 type: boolean
 *               type:
 *                 type: string
 *                 enum: [FIXED, PERCENTAGE, HOURLY]
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               applyAfterGracePeriod:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Early check-in fee configuration updated successfully
 */
router
  .route('/early-checkin-fee')
  .get(authEmployee, employeeAppSettingController.getEarlyCheckInFee)
  .put(
    authEmployee,
    validate(appSettingValidation.updateEarlyCheckInFee),
    employeeAppSettingController.updateEarlyCheckInFee
  );

/**
 * @swagger
 * /v1/employee/config/late-checkout-fee:
 *   get:
 *     summary: Get late check-out fee configuration
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Late check-out fee configuration
 *   put:
 *     summary: Update late check-out fee configuration
 *     tags: [Employee/Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *               - type
 *               - amount
 *               - applyAfterGracePeriod
 *             properties:
 *               enabled:
 *                 type: boolean
 *               type:
 *                 type: string
 *                 enum: [FIXED, PERCENTAGE, HOURLY]
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               applyAfterGracePeriod:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Late check-out fee configuration updated successfully
 */
router
  .route('/late-checkout-fee')
  .get(authEmployee, employeeAppSettingController.getLateCheckOutFee)
  .put(
    authEmployee,
    validate(appSettingValidation.updateLateCheckOutFee),
    employeeAppSettingController.updateLateCheckOutFee
  );

export default router;

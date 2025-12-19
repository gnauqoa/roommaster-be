import express from 'express';
import validate from 'middlewares/validate';
import employeeValidation from 'validations/employee.validation';
import { getEmployeeController } from 'core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

// Get controller instance from DI container
const employeeController = getEmployeeController();

/**
 * @swagger
 * tags:
 *   - name: Employees
 *     description: Employee management endpoints
 */

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - email
 *               - phone
 *               - userGroupId
 *             properties:
 *               code:
 *                 type: string
 *                 example: "EMP001"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@hotel.com"
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *               userGroupId:
 *                 type: integer
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       "201":
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - insufficient permissions
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.EMPLOYEE_CREATE),
    validate(employeeValidation.createEmployee),
    employeeController.createEmployee
  )
  /**
   * @swagger
   * /employees:
   *   get:
   *     summary: Get all employees
   *     tags: [Employees]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name or email
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *     responses:
   *       "200":
   *         description: List of employees
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Employee'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *       "401":
   *         description: Unauthorized
   *       "403":
   *         description: Forbidden - insufficient permissions
   */
  .get(
    auth(PERMISSIONS.EMPLOYEE_READ),
    validate(employeeValidation.getEmployees),
    employeeController.getEmployees
  );

/**
 * @swagger
 * /employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       "200":
 *         description: Employee details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - insufficient permissions
 *       "404":
 *         description: Employee not found
 *   patch:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               userGroupId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - insufficient permissions
 *       "404":
 *         description: Employee not found
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       "204":
 *         description: Employee deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - insufficient permissions
 *       "404":
 *         description: Employee not found
 */
router
  .route('/:employeeId')
  .get(
    auth(PERMISSIONS.EMPLOYEE_READ),
    validate(employeeValidation.getEmployee),
    employeeController.getEmployee
  )
  .patch(
    auth(PERMISSIONS.EMPLOYEE_UPDATE),
    validate(employeeValidation.updateEmployee),
    employeeController.updateEmployee
  )
  .delete(
    auth(PERMISSIONS.EMPLOYEE_DELETE),
    validate(employeeValidation.deleteEmployee),
    employeeController.deleteEmployee
  );

export default router;

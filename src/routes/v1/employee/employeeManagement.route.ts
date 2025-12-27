import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { employeeValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { EmployeeService } from 'services';
import { EmployeeManagementController } from 'controllers/employee/employee.employeeManagement.controller';

const employeeManagementRoute = express.Router();

// Manually instantiate controller with dependencies
const employeeService = container.resolve<EmployeeService>(TOKENS.EmployeeService);
const employeeManagementController = new EmployeeManagementController(employeeService);

/**
 * @swagger
 * tags:
 *   name: Employee Management
 *   description: Employee management endpoints for administrators
 */

/**
 * @swagger
 * /employee/employees:
 *   post:
 *     summary: Create a new employee
 *     description: Create a new employee account (admin only)
 *     tags: [Employee Management]
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
 *               - username
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Employee name
 *               username:
 *                 type: string
 *                 maxLength: 50
 *                 description: Employee username (unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Employee password (min 8 characters, must contain letter and number)
 *               role:
 *                 type: string
 *                 enum: [ADMIN, RECEPTIONIST, HOUSEKEEPING, STAFF]
 *                 default: STAFF
 *                 description: Employee role
 *             example:
 *               name: "Trần Văn B"
 *               username: "tranvanb"
 *               password: "password123"
 *               role: "RECEPTIONIST"
 *     responses:
 *       201:
 *         description: Employee created successfully
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
 *                       example: "clq1234567890abcdef"
 *                     name:
 *                       type: string
 *                       example: "Trần Văn B"
 *                     username:
 *                       type: string
 *                       example: "tranvanb"
 *                     role:
 *                       type: string
 *                       example: "RECEPTIONIST"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Username already exists or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get all employees
 *     description: Retrieve a paginated list of employees with optional filters
 *     tags: [Employee Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or username
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, RECEPTIONIST, HOUSEKEEPING, STAFF]
 *         description: Filter by role
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, username, role, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           username:
 *                             type: string
 *                           role:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       example: 20
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
employeeManagementRoute
  .route('/')
  .post(
    authEmployee,
    validate(employeeValidation.createEmployee),
    employeeManagementController.createEmployee
  )
  .get(
    authEmployee,
    validate(employeeValidation.getEmployees),
    employeeManagementController.getEmployees
  );

/**
 * @swagger
 * /employee/employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     description: Retrieve a specific employee's details
 *     tags: [Employee Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
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
 *                       example: "clq1234567890abcdef"
 *                     name:
 *                       type: string
 *                       example: "Trần Văn B"
 *                     username:
 *                       type: string
 *                       example: "tranvanb"
 *                     role:
 *                       type: string
 *                       example: "RECEPTIONIST"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update employee
 *     description: Update an employee's information
 *     tags: [Employee Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Employee name
 *               role:
 *                 type: string
 *                 enum: [ADMIN, RECEPTIONIST, HOUSEKEEPING, STAFF]
 *                 description: Employee role
 *             example:
 *               name: "Trần Văn C"
 *               role: "ADMIN"
 *     responses:
 *       200:
 *         description: Employee updated successfully
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
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete employee
 *     description: Delete an employee from the system
 *     tags: [Employee Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       204:
 *         description: Employee deleted successfully
 *       400:
 *         description: Cannot delete employee with transaction history
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
employeeManagementRoute
  .route('/:employeeId')
  .get(
    authEmployee,
    validate(employeeValidation.getEmployee),
    employeeManagementController.getEmployee
  )
  .put(
    authEmployee,
    validate(employeeValidation.updateEmployee),
    employeeManagementController.updateEmployee
  )
  .delete(
    authEmployee,
    validate(employeeValidation.deleteEmployee),
    employeeManagementController.deleteEmployee
  );

export default employeeManagementRoute;

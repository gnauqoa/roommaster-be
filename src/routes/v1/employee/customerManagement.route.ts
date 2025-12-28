import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { customerValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { CustomerService } from 'services';
import { CustomerManagementController } from 'controllers/employee/employee.customerManagement.controller';

const customerManagementRoute = express.Router();

// Manually instantiate controller with dependencies
const customerService = container.resolve<CustomerService>(TOKENS.CustomerService);
const customerManagementController = new CustomerManagementController(customerService);

/**
 * @swagger
 * tags:
 *   name: Customer Management
 *   description: Customer management endpoints for employees
 */

/**
 * @swagger
 * /employee/customers:
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer account (employee only)
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
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
 *                 maxLength: 100
 *                 description: Customer full name
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 description: Customer phone number (unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Customer password (min 8 characters, must contain letter and number)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email (optional)
 *               idNumber:
 *                 type: string
 *                 maxLength: 20
 *                 description: ID number (CMND/CCCD)
 *               address:
 *                 type: string
 *                 description: Customer address
 *             example:
 *               fullName: "Nguyễn Văn A"
 *               phone: "0901234567"
 *               password: "password123"
 *               email: "nguyenvana@example.com"
 *               idNumber: "001234567890"
 *               address: "123 Đường Lê Lợi, Quận 1, TP.HCM"
 *     responses:
 *       201:
 *         description: Customer created successfully
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
 *                     fullName:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     phone:
 *                       type: string
 *                       example: "0901234567"
 *                     email:
 *                       type: string
 *                       example: "nguyenvana@example.com"
 *                     idNumber:
 *                       type: string
 *                       example: "001234567890"
 *                     address:
 *                       type: string
 *                       example: "123 Đường Lê Lợi, Quận 1, TP.HCM"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Phone number already registered or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a paginated list of customers with optional filters
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, or email
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
 *           enum: [fullName, phone, email, createdAt, updatedAt]
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
 *         description: Customers retrieved successfully
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
 *                           fullName:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *                           idNumber:
 *                             type: string
 *                           address:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           _count:
 *                             type: object
 *                             properties:
 *                               bookings:
 *                                 type: integer
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
customerManagementRoute
  .route('/')
  .post(
    authEmployee,
    validate(customerValidation.createCustomer),
    customerManagementController.createCustomer
  )
  .get(
    authEmployee,
    validate(customerValidation.getCustomers),
    customerManagementController.getCustomers
  );

/**
 * @swagger
 * /employee/customers/{customerId}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve a specific customer's details
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
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
 *                     fullName:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     phone:
 *                       type: string
 *                       example: "0901234567"
 *                     email:
 *                       type: string
 *                       example: "nguyenvana@example.com"
 *                     idNumber:
 *                       type: string
 *                       example: "001234567890"
 *                     address:
 *                       type: string
 *                       example: "123 Đường Lê Lợi, Quận 1, TP.HCM"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update customer
 *     description: Update a customer's information
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               fullName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Customer full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email
 *               idNumber:
 *                 type: string
 *                 maxLength: 20
 *                 description: ID number (CMND/CCCD)
 *               address:
 *                 type: string
 *                 description: Customer address
 *             example:
 *               fullName: "Nguyễn Văn B"
 *               email: "nguyenvanb@example.com"
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *       400:
 *         description: Email already in use or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete customer
 *     description: Delete a customer from the system
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       204:
 *         description: Customer deleted successfully
 *       400:
 *         description: Cannot delete customer with booking history
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
customerManagementRoute
  .route('/:customerId')
  .get(
    authEmployee,
    validate(customerValidation.getCustomer),
    customerManagementController.getCustomer
  )
  .put(
    authEmployee,
    validate(customerValidation.updateCustomer),
    customerManagementController.updateCustomer
  )
  .delete(
    authEmployee,
    validate(customerValidation.deleteCustomer),
    customerManagementController.deleteCustomer
  );

export default customerManagementRoute;

import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { serviceValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { ServiceService } from 'services';
import { ServiceController } from 'controllers/employee/employee.service.controller';

const serviceRoute = express.Router();

// Manually instantiate controller with dependencies
const serviceService = container.resolve<ServiceService>(TOKENS.ServiceService);
const serviceController = new ServiceController(serviceService);

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Hotel service management endpoints
 */

/**
 * @swagger
 * /employee/services:
 *   post:
 *     summary: Create a new service
 *     description: Create a new hotel service with pricing
 *     tags: [Services]
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Service name
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Service price (VND)
 *               unit:
 *                 type: string
 *                 maxLength: 50
 *                 default: "lần"
 *                 description: Unit of service (e.g., "lần", "giờ", "phần")
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the service is active
 *             example:
 *               name: "Giặt ủi"
 *               price: 50000
 *               unit: "kg"
 *               isActive: true
 *     responses:
 *       201:
 *         description: Service created successfully
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
 *                       example: "Giặt ủi"
 *                     price:
 *                       type: string
 *                       example: "50000"
 *                     unit:
 *                       type: string
 *                       example: "kg"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Service with this name already exists
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get all services
 *     description: Retrieve a paginated list of services with optional filters
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by service name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
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
 *           enum: [name, price, unit, isActive, createdAt, updatedAt]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Services retrieved successfully
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
 *                           price:
 *                             type: string
 *                           unit:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           _count:
 *                             type: object
 *                             properties:
 *                               serviceUsages:
 *                                 type: integer
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
serviceRoute
  .route('/')
  .post(authEmployee, validate(serviceValidation.createService), serviceController.createService)
  .get(authEmployee, validate(serviceValidation.getServices), serviceController.getServices);

/**
 * @swagger
 * /employee/services/{serviceId}:
 *   get:
 *     summary: Get service by ID
 *     description: Retrieve a specific service's details
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
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
 *                       example: "Giặt ủi"
 *                     price:
 *                       type: string
 *                       example: "50000"
 *                     unit:
 *                       type: string
 *                       example: "kg"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     _count:
 *                       type: object
 *                       properties:
 *                         serviceUsages:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update service
 *     description: Update a service's information
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
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
 *                 description: Service name
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Service price (VND)
 *               unit:
 *                 type: string
 *                 maxLength: 50
 *                 description: Unit of service
 *               isActive:
 *                 type: boolean
 *                 description: Whether the service is active
 *             example:
 *               price: 60000
 *               isActive: false
 *     responses:
 *       200:
 *         description: Service updated successfully
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
 *                     price:
 *                       type: string
 *                     unit:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Service with this name already exists
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete service
 *     description: Delete a service from the system
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       204:
 *         description: Service deleted successfully
 *       400:
 *         description: Cannot delete service with usage history
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
serviceRoute
  .route('/:serviceId')
  .get(authEmployee, validate(serviceValidation.getService), serviceController.getService)
  .put(authEmployee, validate(serviceValidation.updateService), serviceController.updateService)
  .delete(authEmployee, validate(serviceValidation.deleteService), serviceController.deleteService);

export default serviceRoute;

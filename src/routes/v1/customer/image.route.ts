import express from 'express';
import CustomerImageController from '@/controllers/customer/customer.image.controller';
import { container, TOKENS } from '@/core/container';
import { ImageService } from '@/services';
import { authCustomer } from '@/middlewares/auth';

export default function createCustomerImageRoutes(): express.Router {
  const router = express.Router();

  // Resolve dependencies from container
  const imageService = container.resolve<ImageService>(TOKENS.ImageService);
  const customerImageController = new CustomerImageController(imageService);

  /**
   * @swagger
   * tags:
   *   name: Customer Images
   *   description: Customer endpoints for viewing room and room type images
   */

  /**
   * @swagger
   * /customer/rooms/{roomId}/images:
   *   get:
   *     summary: Get all images for a specific room
   *     description: Retrieve all images associated with a room, ordered by sortOrder
   *     tags: [Customer Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room ID
   *     responses:
   *       200:
   *         description: List of room images
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   roomId:
   *                     type: string
   *                   cloudinaryId:
   *                     type: string
   *                   url:
   *                     type: string
   *                   secureUrl:
   *                     type: string
   *                   thumbnailUrl:
   *                     type: string
   *                   width:
   *                     type: integer
   *                   height:
   *                     type: integer
   *                   format:
   *                     type: string
   *                   sortOrder:
   *                     type: integer
   *                   isDefault:
   *                     type: boolean
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Room not found
   */
  router.get('/rooms/:roomId/images', authCustomer, customerImageController.getRoomImages);

  /**
   * @swagger
   * /customer/room-types/{roomTypeId}/images:
   *   get:
   *     summary: Get all images for a specific room type
   *     description: Retrieve all images associated with a room type, ordered by sortOrder
   *     tags: [Customer Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room Type ID
   *     responses:
   *       200:
   *         description: List of room type images
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   roomTypeId:
   *                     type: string
   *                   cloudinaryId:
   *                     type: string
   *                   url:
   *                     type: string
   *                   secureUrl:
   *                     type: string
   *                   thumbnailUrl:
   *                     type: string
   *                   width:
   *                     type: integer
   *                   height:
   *                     type: integer
   *                   format:
   *                     type: string
   *                   sortOrder:
   *                     type: integer
   *                   isDefault:
   *                     type: boolean
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Room type not found
   */
  router.get(
    '/room-types/:roomTypeId/images',
    authCustomer,
    customerImageController.getRoomTypeImages
  );

  return router;
}

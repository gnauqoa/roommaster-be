import express from 'express';
import { authEmployee } from '@/middlewares/auth';
import validate from '@/middlewares/validate';
import { roomTypeValidation } from '@/validations';
import { container, TOKENS } from '@/core/container';
import { RoomTypeService, ImageService } from '@/services';
import { RoomTypeController } from '@/controllers/employee/employee.roomType.controller';
import { ImageController } from '@/controllers/employee/employee.image.controller';
import { uploadRoomTypeImage } from '@/middlewares/upload.middleware';

export default function createRoomTypeRoutes(): express.Router {
  const roomTypeRoute = express.Router();

  // Manually instantiate controller with dependencies
  const roomTypeService = container.resolve<RoomTypeService>(TOKENS.RoomTypeService);
  const roomTypeController = new RoomTypeController(roomTypeService);

  // Image controller for image management endpoints
  const imageService = container.resolve<ImageService>(TOKENS.ImageService);
  const imageController = new ImageController(imageService);

  /**
   * @swagger
   * tags:
   *   name: Room Types
   *   description: Room type management endpoints
   */

  /**
   * @swagger
   * /employee/room-types:
   *   post:
   *     summary: Create a new room type
   *     description: Create a new room type with pricing and amenities
   *     tags: [Room Types]
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
   *               - capacity
   *               - totalBed
   *               - pricePerNight
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 description: Room type name
   *               capacity:
   *                 type: integer
   *                 minimum: 1
   *                 description: Maximum number of guests
   *               totalBed:
   *                 type: integer
   *                 minimum: 0
   *                 description: Total number of beds in the room
   *               pricePerNight:
   *                 type: number
   *                 minimum: 0
   *                 description: Price per night (VND)
   *               tagIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of room tag IDs (optional)
   *             example:
   *               name: "Phòng Deluxe"
   *               capacity: 2
   *               totalBed: 2
   *               pricePerNight: 1500000
   *               tagIds: ["tag_id_1", "tag_id_2"]
   *     responses:
   *       201:
   *         description: Room type created successfully
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
   *                       example: "Phòng Deluxe"
   *                     capacity:
   *                       type: integer
   *                       example: 2
   *                     pricePerNight:
   *                       type: string
   *                       example: "1500000"
   *                     amenities:
   *                       type: object
   *                       example:
   *                         wifi: true
   *                         airConditioner: true
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Room type with this name already exists
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *
   *   get:
   *     summary: Get all room types
   *     description: Retrieve a paginated list of room types with optional filters
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by room type name
   *       - in: query
   *         name: minCapacity
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum capacity filter
   *       - in: query
   *         name: maxCapacity
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Maximum capacity filter
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
   *           enum: [name, capacity, pricePerNight, createdAt, updatedAt]
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
   *         description: Room types retrieved successfully
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
   *                           capacity:
   *                             type: integer
   *                           pricePerNight:
   *                             type: string
   *                           amenities:
   *                             type: object
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                           updatedAt:
   *                             type: string
   *                             format: date-time
   *                           _count:
   *                             type: object
   *                             properties:
   *                               rooms:
   *                                 type: integer
   *                               bookingRooms:
   *                                 type: integer
   *                     total:
   *                       type: integer
   *                       example: 5
   *                     page:
   *                       type: integer
   *                       example: 1
   *                     limit:
   *                       type: integer
   *                       example: 10
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute
    .route('/')
    .post(
      authEmployee,
      validate(roomTypeValidation.createRoomType),
      roomTypeController.createRoomType
    )
    .get(authEmployee, validate(roomTypeValidation.getRoomTypes), roomTypeController.getRoomTypes);

  /**
   * @swagger
   * /employee/room-types/{roomTypeId}:
   *   get:
   *     summary: Get room type by ID
   *     description: Retrieve a specific room type's details
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     responses:
   *       200:
   *         description: Room type retrieved successfully
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
   *                       example: "Phòng Deluxe"
   *                     capacity:
   *                       type: integer
   *                       example: 2
   *                     pricePerNight:
   *                       type: string
   *                       example: "1500000"
   *                     amenities:
   *                       type: object
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                     _count:
   *                       type: object
   *                       properties:
   *                         rooms:
   *                           type: integer
   *                         bookingRooms:
   *                           type: integer
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *
   *   put:
   *     summary: Update room type
   *     description: Update a room type's information
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
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
   *                 description: Room type name
   *               capacity:
   *                 type: integer
   *                 minimum: 1
   *                 description: Maximum number of guests
   *               totalBed:
   *                 type: integer
   *                 minimum: 0
   *                 description: Total number of beds in the room
   *               pricePerNight:
   *                 type: number
   *                 minimum: 0
   *                 description: Price per night (VND)
   *               tagIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of room tag IDs
   *             example:
   *               name: "Phòng Superior"
   *               pricePerNight: 1800000
   *     responses:
   *       200:
   *         description: Room type updated successfully
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
   *                     capacity:
   *                       type: integer
   *                     pricePerNight:
   *                       type: string
   *                     amenities:
   *                       type: object
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Room type with this name already exists
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *
   *   delete:
   *     summary: Delete room type
   *     description: Delete a room type from the system
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     responses:
   *       204:
   *         description: Room type deleted successfully
   *       400:
   *         description: Cannot delete room type with associated rooms
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  roomTypeRoute
    .route('/:roomTypeId')
    .get(authEmployee, validate(roomTypeValidation.getRoomType), roomTypeController.getRoomType)
    .put(
      authEmployee,
      validate(roomTypeValidation.updateRoomType),
      roomTypeController.updateRoomType
    )
    .delete(
      authEmployee,
      validate(roomTypeValidation.deleteRoomType),
      roomTypeController.deleteRoomType
    );

  // ==================== ROOM TYPE IMAGE ROUTES ====================

  /**
   * @swagger
   * /employee/room-types/{roomTypeId}/images:
   *   post:
   *     summary: Upload single image for room type
   *     description: Upload a single image and associate it with a room type
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - image
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: Image file (JPEG, PNG, or WebP, max 5MB)
   *               isDefault:
   *                 type: string
   *                 enum: ["true", "false"]
   *                 description: Set as default image
   *               sortOrder:
   *                 type: integer
   *                 description: Sort order for the image
   *     responses:
   *       201:
   *         description: Image uploaded successfully
   *       400:
   *         description: No file uploaded or invalid file type
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *
   *   get:
   *     summary: Get all images for a room type
   *     description: Retrieve all images associated with a room type
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     responses:
   *       200:
   *         description: Images retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute
    .route('/:roomTypeId/images')
    .post(authEmployee, uploadRoomTypeImage.single('image'), imageController.uploadRoomTypeImage)
    .get(authEmployee, imageController.getRoomTypeImages);

  /**
   * @swagger
   * /employee/room-types/{roomTypeId}/images/batch:
   *   post:
   *     summary: Upload multiple images for room type
   *     description: Upload multiple images (up to 10) and associate them with a room type
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - images
   *             properties:
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: Image files (JPEG, PNG, or WebP, max 5MB each, up to 10 files)
   *     responses:
   *       200:
   *         description: All images uploaded successfully
   *       207:
   *         description: Partial success - some images failed to upload
   *       400:
   *         description: No files uploaded
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute.post(
    '/:roomTypeId/images/batch',
    authEmployee,
    uploadRoomTypeImage.array('images', 10),
    imageController.uploadRoomTypeImagesBatch
  );

  /**
   * @swagger
   * /employee/room-types/{roomTypeId}/images/reorder:
   *   put:
   *     summary: Reorder room type images
   *     description: Update the sort order of images for a room type
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - imageIds
   *             properties:
   *               imageIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of image IDs in desired order
   *     responses:
   *       200:
   *         description: Images reordered successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute.put(
    '/:roomTypeId/images/reorder',
    authEmployee,
    imageController.reorderRoomTypeImages
  );

  /**
   * @swagger
   * /employee/room-types/{roomTypeId}/upload-signature:
   *   get:
   *     summary: Get upload signature for direct upload (Mobile)
   *     description: Generate signed parameters for direct upload to Cloudinary from mobile app
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     responses:
   *       200:
   *         description: Upload signature generated
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute.get(
    '/:roomTypeId/upload-signature',
    authEmployee,
    imageController.getRoomTypeUploadSignature
  );

  /**
   * @swagger
   * /employee/room-types/{roomTypeId}/images/direct:
   *   post:
   *     summary: Save image metadata after direct upload
   *     description: Save image metadata to database after direct upload to Cloudinary from mobile app
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomTypeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Room type ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cloudinaryId
   *               - url
   *               - secureUrl
   *             properties:
   *               cloudinaryId:
   *                 type: string
   *               url:
   *                 type: string
   *               secureUrl:
   *                 type: string
   *               width:
   *                 type: integer
   *               height:
   *                 type: integer
   *               format:
   *                 type: string
   *               isDefault:
   *                 type: boolean
   *               sortOrder:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Image metadata saved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute.post(
    '/:roomTypeId/images/direct',
    authEmployee,
    imageController.saveRoomTypeDirectUpload
  );

  /**
   * @swagger
   * /employee/room-types/images/{imageId}:
   *   delete:
   *     summary: Delete room type image
   *     description: Delete an image from both Cloudinary and database
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *         description: Image ID
   *     responses:
   *       204:
   *         description: Image deleted successfully
   *       404:
   *         description: Image not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute.delete('/images/:imageId', authEmployee, imageController.deleteRoomTypeImage);

  /**
   * @swagger
   * /employee/room-types/images/{imageId}/default:
   *   put:
   *     summary: Set image as default for room type
   *     description: Set a specific image as the default image for its room type
   *     tags: [Room Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *         description: Image ID
   *     responses:
   *       200:
   *         description: Default image set successfully
   *       404:
   *         description: Image not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomTypeRoute.put(
    '/images/:imageId/default',
    authEmployee,
    imageController.setDefaultRoomTypeImage
  );

  return roomTypeRoute;
}

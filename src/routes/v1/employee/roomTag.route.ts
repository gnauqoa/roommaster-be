import express from 'express';
import validate from 'middlewares/validate';
import { roomTagValidation } from 'validations';
import EmployeeRoomTagController from 'controllers/employee/employee.roomTag.controller';
import { container, TOKENS } from 'core/container';
import { RoomTagService } from 'services/roomTag.service';
import { authEmployee } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const roomTagService = container.resolve<RoomTagService>(TOKENS.RoomTagService);
const employeeRoomTagController = new EmployeeRoomTagController(roomTagService);

/**
 * @swagger
 * tags:
 *   name: Employee Room Tags
 *   description: Room tag management endpoints
 */

/**
 * @swagger
 * /employee/room-tags:
 *   post:
 *     summary: Create a new room tag
 *     tags: [Employee Room Tags]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Room tag created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authEmployee,
  validate(roomTagValidation.createRoomTag),
  employeeRoomTagController.createRoomTag
);

/**
 * @swagger
 * /employee/room-tags:
 *   get:
 *     summary: Get all room tags
 *     tags: [Employee Room Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of room tags
 *       401:
 *         description: Unauthorized
 */
router.get('/', authEmployee, employeeRoomTagController.getRoomTags);

/**
 * @swagger
 * /employee/room-tags/{tagId}:
 *   get:
 *     summary: Get room tag by ID
 *     tags: [Employee Room Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room tag details
 *       404:
 *         description: Room tag not found
 */
router.get(
  '/:tagId',
  authEmployee,
  validate(roomTagValidation.getRoomTag),
  employeeRoomTagController.getRoomTag
);

/**
 * @swagger
 * /employee/room-tags/{tagId}:
 *   patch:
 *     summary: Update room tag
 *     tags: [Employee Room Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Room tag updated
 *       404:
 *         description: Room tag not found
 */
router.patch(
  '/:tagId',
  authEmployee,
  validate(roomTagValidation.updateRoomTag),
  employeeRoomTagController.updateRoomTag
);

/**
 * @swagger
 * /employee/room-tags/{tagId}:
 *   delete:
 *     summary: Delete room tag
 *     tags: [Employee Room Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room tag deleted
 *       400:
 *         description: Cannot delete tag in use
 *       404:
 *         description: Room tag not found
 */
router.delete(
  '/:tagId',
  authEmployee,
  validate(roomTagValidation.deleteRoomTag),
  employeeRoomTagController.deleteRoomTag
);

export default router;

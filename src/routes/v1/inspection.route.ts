import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { inspectionValidation } from '../../validations';
import { inspectionController } from '../../controllers';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

router.post(
  '/:stayDetailId',
  auth(PERMISSIONS.INSPECTION_CREATE),
  validate(inspectionValidation.createInspection),
  inspectionController.createInspection
);

router.get(
  '/:stayDetailId',
  auth(PERMISSIONS.INSPECTION_READ),
  validate(inspectionValidation.getInspection),
  inspectionController.getInspection
);

router.patch(
  '/:stayDetailId',
  auth(PERMISSIONS.INSPECTION_UPDATE),
  validate(inspectionValidation.updateInspection),
  inspectionController.updateInspection
);

router.get(
  '/:stayDetailId/can-checkout',
  auth(PERMISSIONS.INSPECTION_READ),
  validate(inspectionValidation.canCheckout),
  inspectionController.canCheckout
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Inspections
 *   description: Room inspection before checkout
 */

/**
 * @swagger
 * /inspections/{stayDetailId}:
 *   post:
 *     summary: Create room inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hasDamages:
 *                 type: boolean
 *               damageNotes:
 *                 type: string
 *               damageAmount:
 *                 type: number
 *               hasMissingItems:
 *                 type: boolean
 *               missingItems:
 *                 type: string
 *               missingAmount:
 *                 type: number
 *               hasViolations:
 *                 type: boolean
 *               violationNotes:
 *                 type: string
 *               penaltyAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get room inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     summary: Update room inspection (approve/add notes)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isApproved:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /inspections/{stayDetailId}/can-checkout:
 *   get:
 *     summary: Check if room can be checked out
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canCheckout:
 *                   type: boolean
 */

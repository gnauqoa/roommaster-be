import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { inspectionValidation } from '../../validations';
import { getInspectionController } from '../../core/bootstrap';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Inspections
 *     description: Room inspection management
 */

/**
 * @swagger
 * /inspections/{stayDetailId}:
 *   post:
 *     summary: Create a room inspection
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
 *               notes:
 *                 type: string
 *               damages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       "201":
 *         description: Inspection created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get inspection for a stay detail
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
 *         description: Inspection details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Inspection not found
 *   patch:
 *     summary: Update inspection
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
 *     responses:
 *       "200":
 *         description: Inspection updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:stayDetailId',
  auth(PERMISSIONS.INSPECTION_CREATE),
  validate(inspectionValidation.createInspection),
  getInspectionController().createInspection
);

router.get(
  '/:stayDetailId',
  auth(PERMISSIONS.INSPECTION_READ),
  validate(inspectionValidation.getInspection),
  getInspectionController().getInspection
);

router.patch(
  '/:stayDetailId',
  auth(PERMISSIONS.INSPECTION_UPDATE),
  validate(inspectionValidation.updateInspection),
  getInspectionController().updateInspection
);

/**
 * @swagger
 * /inspections/{stayDetailId}/can-checkout:
 *   get:
 *     summary: Check if guest can checkout
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
 *         description: Checkout eligibility result
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/:stayDetailId/can-checkout',
  auth(PERMISSIONS.INSPECTION_READ),
  validate(inspectionValidation.canCheckout),
  getInspectionController().canCheckout
);

export default router;

import express from 'express';
import validate from 'middlewares/validate';
import folioValidation from 'validations/folio.validation';
import { getFolioController } from 'core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Folios
 *     description: Guest folio and billing management
 */

/**
 * @swagger
 * /folios:
 *   post:
 *     summary: Create a new guest folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stayRecordId
 *             properties:
 *               stayRecordId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Folio created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all folios
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, SETTLED]
 *     responses:
 *       "200":
 *         description: List of folios
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.FOLIO_CREATE),
    validate(folioValidation.createGuestFolio),
    getFolioController().createFolio
  )
  .get(
    auth(PERMISSIONS.FOLIO_READ),
    validate(folioValidation.getGuestFolios),
    getFolioController().getFolios
  );

/**
 * @swagger
 * /folios/{folioId}:
 *   get:
 *     summary: Get folio by ID
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Folio details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Folio not found
 *   patch:
 *     summary: Update folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
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
 *     responses:
 *       "200":
 *         description: Folio updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router
  .route('/:folioId')
  .get(
    auth(PERMISSIONS.FOLIO_READ),
    validate(folioValidation.getGuestFolio),
    getFolioController().getFolio
  )
  .patch(
    auth(PERMISSIONS.FOLIO_UPDATE),
    validate(folioValidation.updateGuestFolio),
    getFolioController().updateFolio
  );

/**
 * @swagger
 * /folios/{folioId}/summary:
 *   get:
 *     summary: Get folio summary
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Folio summary with totals
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/:folioId/summary',
  auth(PERMISSIONS.FOLIO_READ),
  validate(folioValidation.getFolioSummary),
  getFolioController().getFolioSummary
);

/**
 * @swagger
 * /folios/{folioId}/close:
 *   post:
 *     summary: Close a folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
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
 *         description: Folio closed successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/close',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.closeFolio),
  getFolioController().closeFolio
);

// ===== CHARGES =====

/**
 * @swagger
 * /folios/{folioId}/room-charges:
 *   post:
 *     summary: Add room charge to folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stayDetailId
 *               - amount
 *             properties:
 *               stayDetailId:
 *                 type: integer
 *               amount:
 *                 type: number
 *                 format: decimal
 *               description:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Room charge added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/room-charges',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.addRoomCharge),
  getFolioController().addRoomCharge
);

/**
 * @swagger
 * /folios/{folioId}/service-charges:
 *   post:
 *     summary: Add service charge to folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - quantity
 *             properties:
 *               serviceId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               amount:
 *                 type: number
 *                 format: decimal
 *     responses:
 *       "200":
 *         description: Service charge added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/service-charges',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.addServiceCharge),
  getFolioController().addServiceCharge
);

// ===== PAYMENTS =====

/**
 * @swagger
 * /folios/{folioId}/payments:
 *   post:
 *     summary: Add payment to folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethodId
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *               paymentMethodId:
 *                 type: integer
 *               reference:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Payment added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/payments',
  auth(PERMISSIONS.PAYMENT_CREATE),
  validate(folioValidation.addPayment),
  getFolioController().addPayment
);

/**
 * @swagger
 * /folios/{folioId}/deposits:
 *   post:
 *     summary: Add deposit to folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethodId
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *               paymentMethodId:
 *                 type: integer
 *     responses:
 *       "200":
 *         description: Deposit added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/deposits',
  auth(PERMISSIONS.PAYMENT_CREATE),
  validate(folioValidation.addDeposit),
  getFolioController().addDeposit
);

/**
 * @swagger
 * /folios/{folioId}/refunds:
 *   post:
 *     summary: Add refund to folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *               reason:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Refund added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/refunds',
  auth(PERMISSIONS.PAYMENT_CREATE),
  validate(folioValidation.addRefund),
  getFolioController().addRefund
);

/**
 * @swagger
 * /folios/{folioId}/discounts:
 *   post:
 *     summary: Add discount to folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *               reason:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Discount added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:folioId/discounts',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.addDiscount),
  getFolioController().addDiscount
);

/**
 * @swagger
 * /folios/transactions/{transactionId}/void:
 *   post:
 *     summary: Void a transaction
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
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
 *         description: Transaction voided successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/transactions/:transactionId/void',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.voidTransaction),
  getFolioController().voidTransaction
);

export default router;

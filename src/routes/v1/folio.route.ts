import express from 'express';
import validate from 'middlewares/validate';
import folioValidation from 'validations/folio.validation';
import { folioController } from 'controllers';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.FOLIO_CREATE),
    validate(folioValidation.createGuestFolio),
    folioController.createFolio
  )
  .get(
    auth(PERMISSIONS.FOLIO_READ),
    validate(folioValidation.getGuestFolios),
    folioController.getFolios
  );

router
  .route('/:folioId')
  .get(
    auth(PERMISSIONS.FOLIO_READ),
    validate(folioValidation.getGuestFolio),
    folioController.getFolio
  )
  .patch(
    auth(PERMISSIONS.FOLIO_UPDATE),
    validate(folioValidation.updateGuestFolio),
    folioController.updateFolio
  );

router.get(
  '/:folioId/summary',
  auth(PERMISSIONS.FOLIO_READ),
  validate(folioValidation.getFolioSummary),
  folioController.getFolioSummary
);

router.post(
  '/:folioId/close',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.closeFolio),
  folioController.closeFolio
);

// Charges
router.post(
  '/:folioId/room-charges',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.addRoomCharge),
  folioController.addRoomCharge
);

router.post(
  '/:folioId/service-charges',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.addServiceCharge),
  folioController.addServiceCharge
);

// Payments
router.post(
  '/:folioId/payments',
  auth(PERMISSIONS.PAYMENT_CREATE),
  validate(folioValidation.addPayment),
  folioController.addPayment
);

router.post(
  '/:folioId/deposits',
  auth(PERMISSIONS.PAYMENT_CREATE),
  validate(folioValidation.addDeposit),
  folioController.addDeposit
);

router.post(
  '/:folioId/refunds',
  auth(PERMISSIONS.PAYMENT_CREATE),
  validate(folioValidation.addRefund),
  folioController.addRefund
);

router.post(
  '/:folioId/discounts',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.addDiscount),
  folioController.addDiscount
);

// Void transaction
router.post(
  '/transactions/:transactionId/void',
  auth(PERMISSIONS.FOLIO_UPDATE),
  validate(folioValidation.voidTransaction),
  folioController.voidTransaction
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Folios
 *   description: Guest folio and billing management
 */

/**
 * @swagger
 * /folios:
 *   post:
 *     summary: Create a guest folio
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFolio'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all folios
 *     tags: [Folios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /folios/{folioId}/summary:
 *   get:
 *     summary: Get folio summary with balance
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
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

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
 *               paymentMethodId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

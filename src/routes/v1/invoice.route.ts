import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { invoiceValidation } from '../../validations';
import { invoiceController } from '../../controllers';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.INVOICE_CREATE),
    validate(invoiceValidation.createInvoice),
    invoiceController.createInvoice
  )
  .get(
    auth(PERMISSIONS.INVOICE_READ),
    validate(invoiceValidation.getInvoices),
    invoiceController.getInvoices
  );

router
  .route('/:invoiceId')
  .get(
    auth(PERMISSIONS.INVOICE_READ),
    validate(invoiceValidation.getInvoice),
    invoiceController.getInvoice
  );

router.get(
  '/:invoiceId/print',
  auth(PERMISSIONS.INVOICE_READ),
  validate(invoiceValidation.printInvoice),
  invoiceController.getInvoiceForPrint
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice management
 */

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create an invoice from folio transactions
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestFolioId
 *               - invoiceToCustomerId
 *               - transactionIds
 *             properties:
 *               guestFolioId:
 *                 type: integer
 *               invoiceToCustomerId:
 *                 type: integer
 *               taxId:
 *                 type: string
 *               transactionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: guestFolioId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: invoiceToCustomerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /invoices/{invoiceId}/print:
 *   get:
 *     summary: Get invoice data for printing/PDF
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

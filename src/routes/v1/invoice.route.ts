import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { invoiceValidation } from '../../validations';
import { getInvoiceController } from '../../core/bootstrap';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Invoices
 *     description: Invoice generation and management
 */

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
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
 *               - folioId
 *             properties:
 *               folioId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Invoice created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
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
 *           enum: [DRAFT, ISSUED, PAID, CANCELLED]
 *     responses:
 *       "200":
 *         description: List of invoices
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.INVOICE_CREATE),
    validate(invoiceValidation.createInvoice),
    getInvoiceController().createInvoice
  )
  .get(
    auth(PERMISSIONS.INVOICE_READ),
    validate(invoiceValidation.getInvoices),
    getInvoiceController().getInvoices
  );

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
 *         description: Invoice details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Invoice not found
 */
router
  .route('/:invoiceId')
  .get(
    auth(PERMISSIONS.INVOICE_READ),
    validate(invoiceValidation.getInvoice),
    getInvoiceController().getInvoice
  );

/**
 * @swagger
 * /invoices/{invoiceId}/print:
 *   get:
 *     summary: Get invoice for printing
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
 *         description: Printable invoice
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Invoice not found
 */
router.get(
  '/:invoiceId/print',
  auth(PERMISSIONS.INVOICE_READ),
  validate(invoiceValidation.printInvoice),
  getInvoiceController().getInvoiceForPrint
);

export default router;

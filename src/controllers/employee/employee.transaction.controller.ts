// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />

import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { TransactionService } from '@/services/transaction';
import { sendData } from '@/utils/responseWrapper';
import pick from '@/utils/pick';

@Injectable()
export class EmployeeTransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Create a transaction with scenario-based payment handling
   * POST /employee-api/v1/transactions
   *
   * Scenarios:
   * 1. Full booking payment: { bookingId }
   * 2. Split room payment: { bookingId, bookingRoomIds }
   * 3. Service payment (booking): { bookingId, serviceUsageId }
   * 4. Service payment (standalone): { serviceUsageId }
   *
   * Promotion Applications:
   * - Transaction-level: { customerPromotionId }
   * - Room-specific: { customerPromotionId, bookingRoomId }
   * - Service-specific: { customerPromotionId, serviceUsageId }
   */
  createTransaction = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const {
      bookingId,
      bookingRoomIds,
      serviceUsageId,
      paymentMethod,
      transactionType,
      transactionRef,
      description,
      promotionApplications
    } = req.body;

    const result = await this.transactionService.createTransaction({
      bookingId,
      bookingRoomIds,
      serviceUsageId,
      paymentMethod,
      transactionType,
      transactionRef,
      description,
      promotionApplications,
      employeeId: req.employee.id
    });

    sendData(res, result, httpStatus.CREATED);
  });

  /**
   * Get transactions with pagination and filters
   * GET /employee-api/v1/transactions
   */
  getTransactions = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, [
      'bookingId',
      'status',
      'type',
      'method',
      'startDate',
      'endDate',
      'search'
    ]);

    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    const result = await this.transactionService.getTransactions(filters, options);

    sendData(res, result);
  });

  /**
   * Get transaction by ID
   * GET /employee-api/v1/transactions/:transactionId
   */
  getTransactionById = catchAsync(async (req: Request, res: Response) => {
    const transaction = await this.transactionService.getTransactionById(req.params.transactionId);

    sendData(res, transaction);
  });

  /**
   * Get transaction details with filters
   * GET /employee-api/v1/transaction-details
   */
  getTransactionDetails = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, [
      'transactionId',
      'bookingRoomId',
      'serviceUsageId',
      'minBaseAmount',
      'maxBaseAmount',
      'minAmount',
      'maxAmount',
      'minDiscountAmount',
      'maxDiscountAmount',
      'startDate',
      'endDate'
    ]);

    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    const result = await this.transactionService.getTransactionDetails(filters, options);

    sendData(res, result);
  });
}

export default EmployeeTransactionController;

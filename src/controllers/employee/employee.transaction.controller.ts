// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />

import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { TransactionService } from 'services/transaction.service';
import { sendData } from 'utils/responseWrapper';

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
   */
  createTransaction = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const {
      bookingId,
      bookingRoomIds,
      serviceUsageId,
      amount,
      paymentMethod,
      transactionType,
      transactionRef,
      description
    } = req.body;

    const result = await this.transactionService.createTransaction({
      bookingId,
      bookingRoomIds,
      serviceUsageId,
      amount,
      paymentMethod,
      transactionType,
      transactionRef,
      description,
      employeeId: req.employee.id
    });

    sendData(res, result, httpStatus.CREATED);
  });
}

export default EmployeeTransactionController;

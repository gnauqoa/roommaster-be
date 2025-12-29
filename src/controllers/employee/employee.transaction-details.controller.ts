// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />

import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import { TransactionDetailsService } from '@/services/transaction-details.service';
import { sendData } from '@/utils/responseWrapper';
import pick from '@/utils/pick';

@Injectable()
export class EmployeeTransactionDetailsController {
  constructor(private readonly transactionDetailsService: TransactionDetailsService) {}

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

    const result = await this.transactionDetailsService.getTransactionDetails(filters, options);

    sendData(res, result);
  });
}

export default EmployeeTransactionDetailsController;

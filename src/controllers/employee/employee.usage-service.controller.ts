// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { UsageServiceService } from 'services/usage-service.service';
import { sendData } from 'utils/responseWrapper';

@Injectable()
export class EmployeeUsageServiceController {
  constructor(private readonly usageServiceService: UsageServiceService) {}

  /**
   * Create a service usage record
   * POST /employee-api/v1/service/service-usage
   */
  createServiceUsage = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const { bookingId, bookingRoomId, serviceId, quantity } = req.body;

    const result = await this.usageServiceService.createServiceUsage({
      bookingId,
      bookingRoomId,
      serviceId,
      quantity,
      employeeId: req.employee.id
    });

    sendData(res, result, httpStatus.CREATED);
  });

  /**
   * Update a service usage record
   * PATCH /employee-api/v1/service/service-usage/:id
   */
  updateServiceUsage = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const { id } = req.params;
    const { quantity, status } = req.body;

    const result = await this.usageServiceService.updateServiceUsage({
      id,
      quantity,
      status
      // No customerId check for employee - they can update any service usage
    });

    sendData(res, result);
  });

  /**
   * Get service usages with filters
   * GET /employee-api/v1/service/service-usage
   */
  getServiceUsages = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const filter = req.query;
    const options = req.query;

    const result = await this.usageServiceService.getServiceUsages(filter, options);
    sendData(res, result);
  });

  /**
   * Delete service usage
   * DELETE /employee-api/v1/service/service-usage/:id
   */
  deleteServiceUsage = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const result = await this.usageServiceService.deleteServiceUsage(req.params.id);
    sendData(res, result);
  });
}

export default EmployeeUsageServiceController;

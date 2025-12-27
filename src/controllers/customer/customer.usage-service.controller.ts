// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import catchAsync from 'utils/catchAsync';
import { UsageServiceService } from 'services/usage-service.service';

@Injectable()
export class CustomerUsageServiceController {
  constructor(private readonly usageServiceService: UsageServiceService) {}

  /**
   * Create a service usage record (customer) - DEPRECATED
   * Service usage is now employee-only
   * POST /customer-api/v1/service/service-usage
   */
  createServiceUsage = catchAsync(async () => {
    throw new Error('Service usage creation is now employee-only. Please contact staff.');
  });

  /**
   * Update a service usage record (customer) - DEPRECATED
   * Service usage is now employee-only
   * PATCH /customer-api/v1/service/service-usage/:id
   */
  updateServiceUsage = catchAsync(async () => {
    throw new Error('Service usage updates are now employee-only. Please contact staff.');
  });
}

export default CustomerUsageServiceController;

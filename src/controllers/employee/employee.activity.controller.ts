import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import catchAsync from 'utils/catchAsync';
import { ActivityService } from 'services/activity.service';
import { sendData } from 'utils/responseWrapper';
import { ActivityType } from '@prisma/client';

@Injectable()
export class EmployeeActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * Get all activities with filters
   * GET /employee-api/v1/activities
   */
  getActivities = catchAsync(async (req: Request, res: Response) => {
    const {
      type,
      customerId,
      employeeId,
      bookingRoomId,
      serviceUsageId,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters = {
      type: type as ActivityType,
      customerId: customerId as string,
      employeeId: employeeId as string,
      bookingRoomId: bookingRoomId as string,
      serviceUsageId: serviceUsageId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string
    };

    const options = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: (sortBy as string) || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await this.activityService.getAllActivities(filters, options);
    sendData(res, result);
  });

  /**
   * Get activity by ID
   * GET /employee-api/v1/activities/:activityId
   */
  getActivityById = catchAsync(async (req: Request, res: Response) => {
    const activity = await this.activityService.getActivityById(req.params.activityId);
    sendData(res, activity);
  });
}

export default EmployeeActivityController;

import { Request, Response } from 'express';
import { Injectable } from '@/core/decorators';
import catchAsync from '@/utils/catchAsync';
import AppSettingService from '@/services/app-setting.service';
import httpStatus from 'http-status';

@Injectable()
export class EmployeeAppSettingController {
  constructor(private readonly appSettingService: AppSettingService) {}

  /**
   * Get all configurations
   */
  getConfigs = catchAsync(async (req: Request, res: Response) => {
    const configs = await this.appSettingService.getAllConfigs();

    res.status(httpStatus.OK).json({
      success: true,
      data: configs
    });
  });

  /**
   * Get check-in time configuration
   */
  getCheckInTime = catchAsync(async (req: Request, res: Response) => {
    const config = await this.appSettingService.getCheckInTime();

    res.status(httpStatus.OK).json({
      success: true,
      data: config
    });
  });

  /**
   * Update check-in time configuration
   */
  updateCheckInTime = catchAsync(async (req: Request, res: Response) => {
    const { hour, minute, gracePeriodMinutes } = req.body;

    await this.appSettingService.updateCheckInTime({
      hour,
      minute,
      gracePeriodMinutes
    });

    const updatedConfig = await this.appSettingService.getCheckInTime();

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Check-in time updated successfully',
      data: updatedConfig
    });
  });

  /**
   * Get check-out time configuration
   */
  getCheckOutTime = catchAsync(async (req: Request, res: Response) => {
    const config = await this.appSettingService.getCheckOutTime();

    res.status(httpStatus.OK).json({
      success: true,
      data: config
    });
  });

  /**
   * Update check-out time configuration
   */
  updateCheckOutTime = catchAsync(async (req: Request, res: Response) => {
    const { hour, minute, gracePeriodMinutes } = req.body;

    await this.appSettingService.updateCheckOutTime({
      hour,
      minute,
      gracePeriodMinutes
    });

    const updatedConfig = await this.appSettingService.getCheckOutTime();

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Check-out time updated successfully',
      data: updatedConfig
    });
  });
}

export default EmployeeAppSettingController;

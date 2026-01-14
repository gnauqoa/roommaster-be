import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import { sendData } from '@/utils/responseWrapper';
import { AppSettingService } from '@/services';

export class CustomerAppSettingController {
  constructor(private readonly appSettingService: AppSettingService) {}

  getPaymentQrCode = catchAsync(async (req: Request, res: Response) => {
    const config = await this.appSettingService.getPaymentQrCode();
    sendData(res, config);
  });
}

export default CustomerAppSettingController;

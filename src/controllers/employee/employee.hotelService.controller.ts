// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { HotelServiceService } from 'services';
import { sendData, sendNoContent } from 'utils/responseWrapper';
import pick from 'utils/pick';

@Injectable()
export class HotelServiceController {
  constructor(private readonly hotelServiceService: HotelServiceService) {}

  createHotelService = catchAsync(async (req: Request, res: Response) => {
    const service = await this.hotelServiceService.createHotelService(req.body);
    sendData(res, service, httpStatus.CREATED);
  });

  getHotelServices = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search', 'isActive', 'minPrice', 'maxPrice']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params to appropriate types
    if (filters.isActive !== undefined) {
      filters.isActive = filters.isActive === 'true';
    }
    if (filters.minPrice) filters.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) filters.maxPrice = Number(filters.maxPrice);
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);

    const result = await this.hotelServiceService.getAllHotelServices(filters, options);
    sendData(res, result);
  });

  getHotelService = catchAsync(async (req: Request, res: Response) => {
    const service = await this.hotelServiceService.getHotelServiceById(req.params.serviceId);
    sendData(res, service);
  });

  updateHotelService = catchAsync(async (req: Request, res: Response) => {
    const service = await this.hotelServiceService.updateHotelService(
      req.params.serviceId,
      req.body
    );
    sendData(res, service);
  });

  deleteHotelService = catchAsync(async (req: Request, res: Response) => {
    await this.hotelServiceService.deleteHotelService(req.params.serviceId);
    sendNoContent(res);
  });
}

export default HotelServiceController;

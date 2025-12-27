// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { ServiceService } from 'services';
import { sendData, sendNoContent } from 'utils/responseWrapper';
import pick from 'utils/pick';

@Injectable()
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  createService = catchAsync(async (req: Request, res: Response) => {
    const service = await this.serviceService.createService(req.body);
    sendData(res, service, httpStatus.CREATED);
  });

  getServices = catchAsync(async (req: Request, res: Response) => {
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

    const result = await this.serviceService.getAllServices(filters, options);
    sendData(res, result);
  });

  getService = catchAsync(async (req: Request, res: Response) => {
    const service = await this.serviceService.getServiceById(req.params.serviceId);
    sendData(res, service);
  });

  updateService = catchAsync(async (req: Request, res: Response) => {
    const service = await this.serviceService.updateService(req.params.serviceId, req.body);
    sendData(res, service);
  });

  deleteService = catchAsync(async (req: Request, res: Response) => {
    await this.serviceService.deleteService(req.params.serviceId);
    sendNoContent(res);
  });
}

export default ServiceController;

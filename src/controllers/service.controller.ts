import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import ServiceService from 'services/service.service';
import { Injectable } from 'core/decorators';

// Service Controllers

@Injectable()
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  createService = catchAsync(async (req, res) => {
    const service = await this.serviceService.createService(req.body);
    res.status(httpStatus.CREATED).send(service);
  });

  getServices = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'serviceGroup', 'isActive']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.serviceService.queryServices(filter, options);
    res.send(result);
  });

  getService = catchAsync(async (req, res) => {
    const service = await this.serviceService.getServiceById(Number(req.params.serviceId));
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    res.send(service);
  });

  updateService = catchAsync(async (req, res) => {
    const service = await this.serviceService.updateServiceById(
      Number(req.params.serviceId),
      req.body
    );
    res.send(service);
  });

  deleteService = catchAsync(async (req, res) => {
    await this.serviceService.deleteServiceById(Number(req.params.serviceId));
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Payment Method Controllers
  createPaymentMethod = catchAsync(async (req, res) => {
    const method = await this.serviceService.createPaymentMethod(req.body);
    res.status(httpStatus.CREATED).send(method);
  });

  getPaymentMethods = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'isActive']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.serviceService.queryPaymentMethods(filter, options);
    res.send(result);
  });

  getPaymentMethod = catchAsync(async (req, res) => {
    const method = await this.serviceService.getPaymentMethodById(Number(req.params.methodId));
    if (!method) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
    }
    res.send(method);
  });

  updatePaymentMethod = catchAsync(async (req, res) => {
    const method = await this.serviceService.updatePaymentMethodById(
      Number(req.params.methodId),
      req.body
    );
    res.send(method);
  });

  deletePaymentMethod = catchAsync(async (req, res) => {
    await this.serviceService.deletePaymentMethodById(Number(req.params.methodId));
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export default ServiceController;

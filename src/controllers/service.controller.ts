import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { serviceService } from 'services';

// Service Controllers
const createService = catchAsync(async (req, res) => {
  const service = await serviceService.createService(req.body);
  res.status(httpStatus.CREATED).send(service);
});

const getServices = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'serviceGroup', 'isActive']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await serviceService.queryServices(filter, options);
  res.send(result);
});

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(Number(req.params.serviceId));
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }
  res.send(service);
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateServiceById(Number(req.params.serviceId), req.body);
  res.send(service);
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteServiceById(Number(req.params.serviceId));
  res.status(httpStatus.NO_CONTENT).send();
});

// Payment Method Controllers
const createPaymentMethod = catchAsync(async (req, res) => {
  const method = await serviceService.createPaymentMethod(req.body);
  res.status(httpStatus.CREATED).send(method);
});

const getPaymentMethods = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'isActive']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await serviceService.queryPaymentMethods(filter, options);
  res.send(result);
});

const getPaymentMethod = catchAsync(async (req, res) => {
  const method = await serviceService.getPaymentMethodById(Number(req.params.methodId));
  if (!method) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
  }
  res.send(method);
});

const updatePaymentMethod = catchAsync(async (req, res) => {
  const method = await serviceService.updatePaymentMethodById(
    Number(req.params.methodId),
    req.body
  );
  res.send(method);
});

const deletePaymentMethod = catchAsync(async (req, res) => {
  await serviceService.deletePaymentMethodById(Number(req.params.methodId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};

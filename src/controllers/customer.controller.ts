import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { customerService } from 'services';

// Customer Tier Controllers
const createCustomerTier = catchAsync(async (req, res) => {
  const tier = await customerService.createCustomerTier(req.body);
  res.status(httpStatus.CREATED).send(tier);
});

const getCustomerTiers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'code']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await customerService.queryCustomerTiers(filter, options);
  res.send(result);
});

const getCustomerTier = catchAsync(async (req, res) => {
  const tier = await customerService.getCustomerTierById(Number(req.params.tierId));
  if (!tier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
  }
  res.send(tier);
});

const updateCustomerTier = catchAsync(async (req, res) => {
  const tier = await customerService.updateCustomerTierById(Number(req.params.tierId), req.body);
  res.send(tier);
});

const deleteCustomerTier = catchAsync(async (req, res) => {
  await customerService.deleteCustomerTierById(Number(req.params.tierId));
  res.status(httpStatus.NO_CONTENT).send();
});

// Customer Controllers
const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(httpStatus.CREATED).send(customer);
});

const getCustomers = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'name',
    'email',
    'phone',
    'idNumber',
    'customerType',
    'nationality'
  ]);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await customerService.queryCustomers(filter, options);
  res.send(result);
});

const getCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(Number(req.params.customerId));
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }
  res.send(customer);
});

const searchCustomers = catchAsync(async (req, res) => {
  const { query } = req.query;
  const customers = await customerService.searchCustomers(query as string);
  res.send(customers);
});

const updateCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomerById(
    Number(req.params.customerId),
    req.body
  );
  res.send(customer);
});

const deleteCustomer = catchAsync(async (req, res) => {
  await customerService.deleteCustomerById(Number(req.params.customerId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createCustomerTier,
  getCustomerTiers,
  getCustomerTier,
  updateCustomerTier,
  deleteCustomerTier,
  createCustomer,
  getCustomers,
  getCustomer,
  searchCustomers,
  updateCustomer,
  deleteCustomer
};

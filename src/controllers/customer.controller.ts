import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import CustomerService from 'services/customer.service';
import { Injectable } from 'core/decorators';

// Customer Tier Controllers

@Injectable()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  createCustomerTier = catchAsync(async (req, res) => {
    const tier = await this.customerService.createCustomerTier(req.body);
    res.status(httpStatus.CREATED).send(tier);
  });

  getCustomerTiers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'code']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.customerService.queryCustomerTiers(filter, options);
    res.send(result);
  });

  getCustomerTier = catchAsync(async (req, res) => {
    const tier = await this.customerService.getCustomerTierById(Number(req.params.tierId));
    if (!tier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
    }
    res.send(tier);
  });

  updateCustomerTier = catchAsync(async (req, res) => {
    const tier = await this.customerService.updateCustomerTierById(
      Number(req.params.tierId),
      req.body
    );
    res.send(tier);
  });

  deleteCustomerTier = catchAsync(async (req, res) => {
    await this.customerService.deleteCustomerTierById(Number(req.params.tierId));
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Customer Controllers
  createCustomer = catchAsync(async (req, res) => {
    const customer = await this.customerService.createCustomer(req.body);
    res.status(httpStatus.CREATED).send(customer);
  });

  getCustomers = catchAsync(async (req, res) => {
    const filter = pick(req.query, [
      'name',
      'email',
      'phone',
      'idNumber',
      'customerType',
      'nationality'
    ]);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.customerService.queryCustomers(filter, options);
    res.send(result);
  });

  getCustomer = catchAsync(async (req, res) => {
    const customer = await this.customerService.getCustomerById(Number(req.params.customerId));
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }
    res.send(customer);
  });

  searchCustomers = catchAsync(async (req, res) => {
    const { query } = req.query;
    const customers = await this.customerService.searchCustomers(query as string);
    res.send(customers);
  });

  updateCustomer = catchAsync(async (req, res) => {
    const customer = await this.customerService.updateCustomerById(
      Number(req.params.customerId),
      req.body
    );
    res.send(customer);
  });

  deleteCustomer = catchAsync(async (req, res) => {
    await this.customerService.deleteCustomerById(Number(req.params.customerId));
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export default CustomerController;

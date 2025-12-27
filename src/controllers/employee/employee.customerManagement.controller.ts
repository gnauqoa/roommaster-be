// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { CustomerService } from 'services';
import { sendData, sendNoContent } from 'utils/responseWrapper';
import exclude from 'utils/exclude';
import pick from 'utils/pick';

@Injectable()
export class CustomerManagementController {
  constructor(private readonly customerService: CustomerService) {}

  createCustomer = catchAsync(async (req: Request, res: Response) => {
    const customer = await this.customerService.createCustomer(req.body);
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, customerWithoutPassword, httpStatus.CREATED);
  });

  getCustomers = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params to numbers
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);

    const result = await this.customerService.getAllCustomers(filters, options);
    sendData(res, result);
  });

  getCustomer = catchAsync(async (req: Request, res: Response) => {
    const customer = await this.customerService.getCustomerById(req.params.customerId);
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, customerWithoutPassword);
  });

  updateCustomer = catchAsync(async (req: Request, res: Response) => {
    const customer = await this.customerService.updateCustomer(req.params.customerId, req.body);
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, customerWithoutPassword);
  });

  deleteCustomer = catchAsync(async (req: Request, res: Response) => {
    await this.customerService.deleteCustomer(req.params.customerId);
    sendNoContent(res);
  });
}

export default CustomerManagementController;

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { AuthService, CustomerService, TokenService } from 'services';
import exclude from 'utils/exclude';
import { sendData, sendNoContent } from 'utils/responseWrapper';

@Injectable()
export class CustomerController {
  constructor(
    private readonly authService: AuthService,
    private readonly customerService: CustomerService,
    private readonly tokenService: TokenService
  ) {}

  register = catchAsync(async (req: Request, res: Response) => {
    const customer = await this.customerService.createCustomer(req.body);
    const tokens = await this.tokenService.generateAuthTokens(customer.id, 'customer');
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, { customer: customerWithoutPassword, tokens }, httpStatus.CREATED);
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    const { customer, tokens } = await this.authService.loginCustomerWithPhoneAndPassword(
      phone,
      password
    );
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, { customer: customerWithoutPassword, tokens });
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    await this.authService.logout(req.body.refreshToken);
    sendNoContent(res);
  });

  refreshTokens = catchAsync(async (req: Request, res: Response) => {
    const tokens = await this.authService.refreshAuth(req.body.refreshToken);
    sendData(res, { tokens });
  });

  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const resetPasswordToken = await this.tokenService.generateResetPasswordToken(
      req.body.phone,
      'customer'
    );
    sendData(res, { resetPasswordToken });
  });

  resetPassword = catchAsync(async (req: Request, res: Response) => {
    await this.authService.resetPassword(req.query.token as string, req.body.password);
    sendNoContent(res);
  });

  getProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }
    const authenticatedCustomer = req.customer;
    const customer = await this.customerService.getCustomerById(authenticatedCustomer.id);
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, customerWithoutPassword);
  });

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }
    const authenticatedCustomer = req.customer;
    const customer = await this.customerService.updateCustomer(authenticatedCustomer.id, req.body);
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, customerWithoutPassword);
  });

  changePassword = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }
    const authenticatedCustomer = req.customer;
    await this.authService.changePassword(
      authenticatedCustomer.id,
      'customer',
      req.body.currentPassword,
      req.body.newPassword
    );
    sendNoContent(res);
  });
}

export default CustomerController;

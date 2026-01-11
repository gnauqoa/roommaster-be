// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { AuthService, CustomerService, TokenService, EmailService } from '@/services';
import exclude from '@/utils/exclude';
import { sendData, sendNoContent } from '@/utils/responseWrapper';
import ApiError from '@/utils/ApiError';

@Injectable()
export class CustomerController {
  constructor(
    private readonly authService: AuthService,
    private readonly customerService: CustomerService,
    private readonly tokenService: TokenService,
    private readonly emailService?: EmailService
  ) {}

  register = catchAsync(async (req: Request, res: Response) => {
    const customer = await this.customerService.createCustomer(req.body);
    const tokens = await this.tokenService.generateAuthTokens(customer.id, 'customer');

    // Send verification email if email is provided
    if (customer.email && this.emailService) {
      try {
        const verificationToken = this.tokenService.generateEmailVerificationToken(customer.id);

        // Save verification token to customer first
        await this.customerService.updateCustomer(customer.id, {
          emailVerificationToken: verificationToken
        });

        // Send email without awaiting (fire-and-forget) to avoid blocking the response
        this.emailService.sendVerificationEmail(
          customer.email,
          customer.fullName,
          verificationToken
        ).catch((error) => {
          console.error('Failed to send verification email:', error);
        });
      } catch (error) {
        console.error('Failed to prepare verification email:', error);
        // Don't fail registration if email preparation fails
      }
    }

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

  verifyEmail = catchAsync(async (req: Request, res: Response) => {
    await this.authService.verifyEmail(req.query.token as string);
    sendData(res, { message: 'Email verified successfully' });
  });

  resendVerification = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }
    const authenticatedCustomer = req.customer;

    const customer = await this.customerService.getCustomerById(authenticatedCustomer.id);

    if (customer.isEmailVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified');
    }

    if (!customer.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No email address associated with this account');
    }

    const verificationToken = this.tokenService.generateEmailVerificationToken(customer.id);

    // Save verification token to customer first
    await this.customerService.updateCustomer(customer.id, {
      emailVerificationToken: verificationToken
    });

    // Send verification email without awaiting (fire-and-forget)
    if (!this.emailService) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Email service is not available');
    }

    this.emailService.sendVerificationEmail(
      customer.email,
      customer.fullName,
      verificationToken
    ).catch((error) => {
      console.error('Failed to send verification email:', error);
    });

    sendData(res, { message: 'Verification email sent' });
  });
}

export default CustomerController;

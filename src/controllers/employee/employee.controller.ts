// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { AuthService, EmployeeService, TokenService } from '@/services';
import exclude from '@/utils/exclude';
import { sendData, sendNoContent } from '@/utils/responseWrapper';

@Injectable()
export class EmployeeController {
  constructor(
    private readonly authService: AuthService,
    private readonly employeeService: EmployeeService,
    private readonly tokenService: TokenService
  ) {}

  login = catchAsync(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const { employee, tokens } = await this.authService.loginEmployeeWithUsernameAndPassword(
      username,
      password
    );
    const employeeWithoutPassword = exclude(employee, ['password']);
    sendData(res, { employee: employeeWithoutPassword, tokens });
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
      req.body.username,
      'employee'
    );
    sendData(res, { resetPasswordToken });
  });

  resetPassword = catchAsync(async (req: Request, res: Response) => {
    await this.authService.resetPassword(req.query.token as string, req.body.password);
    sendNoContent(res);
  });

  getProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee) {
      return res.status(httpStatus.UNAUTHORIZED).send({ message: 'Employee not authenticated' });
    }
    const authenticatedEmployee = req.employee;
    const employee = await this.employeeService.getEmployeeById(authenticatedEmployee.id);
    const employeeWithoutPassword = exclude(employee, ['password']);
    sendData(res, employeeWithoutPassword);
  });

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee) {
      return res.status(httpStatus.UNAUTHORIZED).send({ message: 'Employee not authenticated' });
    }
    const authenticatedEmployee = req.employee;
    const employee = await this.employeeService.updateEmployee(authenticatedEmployee.id, req.body);
    const employeeWithoutPassword = exclude(employee, ['password']);
    sendData(res, employeeWithoutPassword);
  });

  changePassword = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee) {
      return res.status(httpStatus.UNAUTHORIZED).send({ message: 'Employee not authenticated' });
    }
    const authenticatedEmployee = req.employee;
    await this.authService.changePassword(
      authenticatedEmployee.id,
      'employee',
      req.body.currentPassword,
      req.body.newPassword
    );
    sendNoContent(res);
  });
}

export default EmployeeController;

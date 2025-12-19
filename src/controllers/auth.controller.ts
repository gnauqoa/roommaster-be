import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { AuthService } from 'services/auth.service';
import { TokenService } from 'services/token.service';
import { EmailService } from 'services/email.service';
import { EmployeeService } from 'services/employee.service';
import exclude from 'utils/exclude';
import { Employee } from '@prisma/client';
import { Injectable } from 'core/decorators';

@Injectable()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly employeeService: EmployeeService
  ) {}

  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const employee = await this.authService.loginWithEmailAndPassword(email, password);
    const tokens = await this.tokenService.generateAuthTokens(employee as { id: number });
    res.send({ employee, tokens });
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    await this.authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  refreshTokens = catchAsync(async (req: Request, res: Response) => {
    const tokens = await this.authService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
  });

  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const resetPasswordToken = await this.tokenService.generateResetPasswordToken(req.body.email);
    await this.emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  resetPassword = catchAsync(async (req: Request, res: Response) => {
    await this.authService.resetPassword(req.query.token as string, req.body.password);
    res.status(httpStatus.NO_CONTENT).send();
  });

  changePassword = catchAsync(async (req: Request, res: Response) => {
    const employee = req.user as Employee;
    await this.authService.changePassword(
      employee.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(httpStatus.NO_CONTENT).send();
  });

  getProfile = catchAsync(async (req: Request, res: Response) => {
    const employee = req.user as Employee;
    const profile = await this.employeeService.getEmployeeById(employee.id);
    if (!profile) {
      res.status(httpStatus.NOT_FOUND).send({ message: 'Employee not found' });
      return;
    }
    res.send(exclude(profile, ['passwordHash']));
  });

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    const employee = req.user as Employee;
    const updated = await this.employeeService.updateEmployeeById(employee.id, req.body);
    res.send(exclude(updated, ['passwordHash']));
  });
}

export default AuthController;

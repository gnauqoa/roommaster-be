import { PrismaClient } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { encryptPassword, isPasswordMatch } from '@/utils/encryption';
import { TokenService, UserType } from './token.service';
import { CustomerService } from './customer.service';
import { EmployeeService } from './employee.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
    private readonly customerService: CustomerService,
    private readonly employeeService: EmployeeService
  ) {}

  /**
   * Login customer with phone and password
   * @param {string} phone - Customer phone
   * @param {string} password - Customer password
   * @returns {Promise<object>} Customer and tokens
   */
  async loginCustomerWithPhoneAndPassword(phone: string, password: string) {
    const customer = await this.customerService.getCustomerByPhone(phone);

    if (!customer || !(await isPasswordMatch(password, customer.password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect phone or password');
    }

    const tokens = this.tokenService.generateAuthTokens(customer.id, 'customer');

    return { customer, tokens };
  }

  /**
   * Login employee with username and password
   * @param {string} username - Employee username
   * @param {string} password - Employee password
   * @returns {Promise<object>} Employee and tokens
   */
  async loginEmployeeWithUsernameAndPassword(username: string, password: string) {
    const employee = await this.employeeService.getEmployeeByUsername(username);

    if (!employee || !(await isPasswordMatch(password, employee.password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect username or password');
    }

    const tokens = this.tokenService.generateAuthTokens(employee.id, 'employee');

    return { employee, tokens };
  }

  /**
   * Logout (stateless - client should discard tokens)
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<void>}
   */
  async logout(refreshToken: string): Promise<void> {
    // With stateless JWT, logout is handled client-side by discarding tokens
    // We just verify the token is valid
    try {
      this.tokenService.verifyToken(refreshToken, 'REFRESH');
    } catch (error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
    }
  }

  /**
   * Refresh auth tokens
   * @param {string} refreshToken - Refresh token
   * @returns {object} New tokens
   */
  refreshAuth(refreshToken: string) {
    try {
      const payload = this.tokenService.verifyToken(refreshToken, 'REFRESH');
      const userId = payload.sub;
      const userType: UserType = payload.userType;

      if (!userId) {
        throw new Error('Invalid token');
      }

      return this.tokenService.generateAuthTokens(userId, userType);
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
    }
  }

  /**
   * Reset password
   * @param {string} resetPasswordToken - Reset password token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async resetPassword(resetPasswordToken: string, newPassword: string): Promise<void> {
    try {
      const payload = this.tokenService.verifyToken(resetPasswordToken, 'RESET_PASSWORD');
      const userId = payload.sub;
      const userType: UserType = payload.userType;

      if (!userId) {
        throw new Error('Invalid token');
      }

      const hashedPassword = await encryptPassword(newPassword);

      if (userType === 'customer') {
        await this.prisma.customer.update({
          where: { id: userId },
          data: { password: hashedPassword }
        });
      } else {
        await this.prisma.employee.update({
          where: { id: userId },
          data: { password: hashedPassword }
        });
      }
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {UserType} userType - User type
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(
    userId: string,
    userType: UserType,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    let user;

    if (userType === 'customer') {
      user = await this.customerService.getCustomerById(userId);
    } else {
      user = await this.employeeService.getEmployeeById(userId);
    }

    if (!(await isPasswordMatch(currentPassword, user.password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect current password');
    }

    const hashedPassword = await encryptPassword(newPassword);

    if (userType === 'customer') {
      await this.prisma.customer.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
    } else {
      await this.prisma.employee.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
    }
  }
}

export default AuthService;

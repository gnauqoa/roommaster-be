import httpStatus from 'http-status';
import { TokenService } from './token.service';
import { EmployeeService } from './employee.service';
import { Employee, PrismaClient } from '@prisma/client';
import { encryptPassword, isPasswordMatch } from 'utils/encryption';
import { AuthTokensResponse } from 'types/response';
import exclude from 'utils/exclude';
import ApiError from 'utils/ApiError';
import { Injectable } from 'core/decorators';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
    private readonly employeeService: EmployeeService
  ) {}

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Omit<Employee, 'passwordHash'>>}
   */
  async loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<Omit<Employee, 'passwordHash'>> {
    const employee = await this.employeeService.getEmployeeByEmail(email);
    if (!employee || !(await isPasswordMatch(password, employee.passwordHash))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    if (!employee.isActive) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Account is inactive');
    }
    return exclude(employee, ['passwordHash']);
  }

  /**
   * Logout
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  async logout(refreshToken: string): Promise<void> {
    const refreshTokenData = await this.prisma.token.findFirst({
      where: {
        token: refreshToken,
        type: 'REFRESH',
        blacklisted: false
      }
    });
    if (!refreshTokenData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }
    await this.prisma.token.delete({ where: { id: refreshTokenData.id } });
  }

  /**
   * Refresh auth tokens
   * @param {string} refreshToken
   * @returns {Promise<AuthTokensResponse>}
   */
  async refreshAuth(refreshToken: string): Promise<AuthTokensResponse> {
    try {
      const refreshTokenData = await this.tokenService.verifyToken(refreshToken, 'REFRESH');
      const { employeeId } = refreshTokenData;
      await this.prisma.token.delete({ where: { id: refreshTokenData.id } });
      return this.tokenService.generateAuthTokens({ id: employeeId });
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
  }

  /**
   * Reset password
   * @param {string} resetPasswordToken
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async resetPassword(resetPasswordToken: string, newPassword: string): Promise<void> {
    try {
      const resetPasswordTokenData = await this.tokenService.verifyToken(
        resetPasswordToken,
        'RESET_PASSWORD'
      );
      const employee = await this.employeeService.getEmployeeById(
        resetPasswordTokenData.employeeId
      );
      if (!employee) {
        throw new Error();
      }
      const encryptedPassword = await encryptPassword(newPassword);
      await this.employeeService.updateEmployeeById(employee.id, {
        passwordHash: encryptedPassword
      });
      await this.prisma.token.deleteMany({
        where: { employeeId: employee.id, type: 'RESET_PASSWORD' }
      });
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
  }

  /**
   * Change password
   * @param {number} employeeId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async changePassword(
    employeeId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const employee = await this.employeeService.getEmployeeById(employeeId);
    if (!employee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    if (!(await isPasswordMatch(currentPassword, employee.passwordHash))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
    }

    const encryptedPassword = await encryptPassword(newPassword);
    await this.employeeService.updateEmployeeById(employeeId, { passwordHash: encryptedPassword });
  }
}

export default AuthService;

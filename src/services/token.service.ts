import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import config from 'config/env';
import { EmployeeService } from './employee.service';
import { Token, PrismaClient } from '@prisma/client';
import { AuthTokensResponse } from 'types/response';
import ApiError from 'utils/ApiError';
import { Injectable } from 'core/decorators';

type TokenType = 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly employeeService: EmployeeService
  ) {}

  /**
   * Generate token
   * @param {number} employeeId
   * @param {Moment} expires
   * @param {string} type
   * @param {string} [secret]
   * @returns {string}
   */
  generateToken(
    employeeId: number,
    expires: Moment,
    type: TokenType,
    secret = config.jwt.secret
  ): string {
    const payload = {
      sub: employeeId,
      iat: moment().unix(),
      exp: expires.unix(),
      type
    };
    return jwt.sign(payload, secret);
  }

  /**
   * Save a token
   * @param {string} token
   * @param {number} employeeId
   * @param {Moment} expires
   * @param {string} type
   * @param {boolean} [blacklisted]
   * @returns {Promise<Token>}
   */
  async saveToken(
    token: string,
    employeeId: number,
    expires: Moment,
    type: TokenType,
    blacklisted = false
  ): Promise<Token> {
    const createdToken = this.prisma.token.create({
      data: {
        token,
        employeeId,
        expires: expires.toDate(),
        type,
        blacklisted
      }
    });
    return createdToken;
  }

  /**
   * Verify token and return token doc (or throw an error if it is not valid)
   * @param {string} token
   * @param {string} type
   * @returns {Promise<Token>}
   */
  async verifyToken(token: string, type: TokenType): Promise<Token> {
    const payload = jwt.verify(token, config.jwt.secret);
    const employeeId = Number(payload.sub);
    const tokenData = await this.prisma.token.findFirst({
      where: { token, type, employeeId, blacklisted: false }
    });
    if (!tokenData) {
      throw new Error('Token not found');
    }
    return tokenData;
  }

  /**
   * Generate auth tokens
   * @param {Object} employee
   * @returns {Promise<AuthTokensResponse>}
   */
  async generateAuthTokens(employee: { id: number }): Promise<AuthTokensResponse> {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = this.generateToken(employee.id, accessTokenExpires, 'ACCESS');

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = this.generateToken(employee.id, refreshTokenExpires, 'REFRESH');
    await this.saveToken(refreshToken, employee.id, refreshTokenExpires, 'REFRESH');

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate()
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate()
      }
    };
  }

  /**
   * Generate reset password token
   * @param {string} email
   * @returns {Promise<string>}
   */
  async generateResetPasswordToken(email: string): Promise<string> {
    const employee = await this.employeeService.getEmployeeByEmail(email);
    if (!employee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No employee found with this email');
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = this.generateToken(employee.id, expires, 'RESET_PASSWORD');
    await this.saveToken(resetPasswordToken, employee.id, expires, 'RESET_PASSWORD');
    return resetPasswordToken;
  }
}

export default TokenService;

import { PrismaClient } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import config from '@/config/env';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

export type TokenType = 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD';
export type UserType = 'customer' | 'employee';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @param {UserType} userType - Type of user (customer or employee)
   * @param {Moment} expires - Token expiration time
   * @param {TokenType} type - Token type
   * @param {string} [secret] - JWT secret (defaults to config)
   * @returns {string} JWT token
   */
  generateToken(
    userId: string,
    userType: UserType,
    expires: Moment,
    type: TokenType,
    secret: string = config.jwt.secret
  ): string {
    const payload = {
      sub: userId,
      userType,
      type,
      iat: moment().unix(),
      exp: expires.unix()
    };
    return jwt.sign(payload, secret);
  }

  /**
   * Verify token and return decoded payload
   * @param {string} token - JWT token
   * @param {TokenType} type - Token type
   * @returns {object} Decoded token payload
   */
  verifyToken(token: string, type: TokenType) {
    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }

    if (typeof payload === 'string' || payload.type !== type) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
    }

    return payload;
  }

  /**
   * Generate auth tokens (access and refresh)
   * @param {string} userId - User ID
   * @param {UserType} userType - Type of user
   * @returns {object} Access and refresh tokens
   */
  generateAuthTokens(userId: string, userType: UserType) {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = this.generateToken(userId, userType, accessTokenExpires, 'ACCESS');

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = this.generateToken(userId, userType, refreshTokenExpires, 'REFRESH');

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
   * @param {string} identifier - Phone for customer, email for employee
   * @param {UserType} userType - Type of user
   * @returns {Promise<string>} Reset password token
   */
  async generateResetPasswordToken(identifier: string, userType: UserType): Promise<string> {
    let user;
    if (userType === 'customer') {
      user = await this.prisma.customer.findUnique({ where: { phone: identifier } });
    } else {
      user = await this.prisma.employee.findFirst({ where: { username: identifier } });
    }

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No user found with this identifier');
    }

    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = this.generateToken(user.id, userType, expires, 'RESET_PASSWORD');

    return resetPasswordToken;
  }
}

export default TokenService;

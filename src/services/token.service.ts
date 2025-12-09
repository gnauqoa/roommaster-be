import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import config from 'config/env';
import employeeService from './employee.service';
import { Token } from '@prisma/client';
import prisma from 'prisma';
import { AuthTokensResponse } from 'types/response';
import ApiError from 'utils/ApiError';

type TokenType = 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD';

/**
 * Generate token
 * @param {number} employeeId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (
  employeeId: number,
  expires: Moment,
  type: TokenType,
  secret = config.jwt.secret
): string => {
  const payload = {
    sub: employeeId,
    iat: moment().unix(),
    exp: expires.unix(),
    type
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {number} employeeId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (
  token: string,
  employeeId: number,
  expires: Moment,
  type: TokenType,
  blacklisted = false
): Promise<Token> => {
  const createdToken = prisma.token.create({
    data: {
      token,
      employeeId,
      expires: expires.toDate(),
      type,
      blacklisted
    }
  });
  return createdToken;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
  const payload = jwt.verify(token, config.jwt.secret);
  const employeeId = Number(payload.sub);
  const tokenData = await prisma.token.findFirst({
    where: { token, type, employeeId, blacklisted: false }
  });
  if (!tokenData) {
    throw new Error('Token not found');
  }
  return tokenData;
};

/**
 * Generate auth tokens
 * @param {Object} employee
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (employee: { id: number }): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(employee.id, accessTokenExpires, 'ACCESS');

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(employee.id, refreshTokenExpires, 'REFRESH');
  await saveToken(refreshToken, employee.id, refreshTokenExpires, 'REFRESH');

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
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const employee = await employeeService.getEmployeeByEmail(email);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No employee found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(employee.id, expires, 'RESET_PASSWORD');
  await saveToken(resetPasswordToken, employee.id, expires, 'RESET_PASSWORD');
  return resetPasswordToken;
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken
};

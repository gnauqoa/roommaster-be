/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { TokenService } from '../../../src/services/token.service';

import moment from 'moment';
import jwt from 'jsonwebtoken';
import config from '../../../src/config/env';
import ApiError from '../../../src/utils/ApiError';

// Create a simple mock Prisma client for this test
const createMockPrisma = () => ({
  customer: {
    findUnique: jest.fn()
  },
  employee: {
    findFirst: jest.fn()
  }
});

describe('TokenService', () => {
  let tokenService: TokenService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    tokenService = new TokenService(mockPrisma as any);
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user-123';
      const userType = 'customer';
      const expires = moment().add(30, 'minutes');
      const type = 'ACCESS';

      const token = tokenService.generateToken(userId, userType, expires, type);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      expect(decoded.sub).toBe(userId);
      expect(decoded.userType).toBe(userType);
      expect(decoded.type).toBe(type);
      expect(decoded.exp).toBe(expires.unix());
    });

    it('should generate token with custom secret', () => {
      const userId = 'user-123';
      const userType = 'employee';
      const expires = moment().add(1, 'hour');
      const type = 'REFRESH';
      const customSecret = 'custom-secret-key';

      const token = tokenService.generateToken(userId, userType, expires, type, customSecret);

      const decoded = jwt.verify(token, customSecret) as any;
      expect(decoded.sub).toBe(userId);
      expect(decoded.userType).toBe(userType);
    });

    it('should include iat (issued at) timestamp', () => {
      const userId = 'user-123';
      const userType = 'customer';
      const expires = moment().add(30, 'minutes');
      const type = 'ACCESS';

      const beforeGeneration = moment().unix();
      const token = tokenService.generateToken(userId, userType, expires, type);
      const afterGeneration = moment().unix();

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      expect(decoded.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(decoded.iat).toBeLessThanOrEqual(afterGeneration);
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload for valid token', () => {
      const userId = 'user-456';
      const userType = 'employee';
      const expires = moment().add(1, 'hour');
      const type = 'ACCESS';

      const token = tokenService.generateToken(userId, userType, expires, type);
      const payload = tokenService.verifyToken(token, type);

      expect(payload.sub).toBe(userId);
      expect(payload.userType).toBe(userType);
      expect(payload.type).toBe(type);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => tokenService.verifyToken(invalidToken, 'ACCESS')).toThrow(ApiError);
      expect(() => tokenService.verifyToken(invalidToken, 'ACCESS')).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const userId = 'user-789';
      const userType = 'customer';
      const expires = moment().subtract(1, 'hour'); // Expired
      const type = 'REFRESH';

      const token = tokenService.generateToken(userId, userType, expires, type);

      expect(() => tokenService.verifyToken(token, type)).toThrow(ApiError);
    });

    it('should throw error for wrong token type', () => {
      const userId = 'user-101';
      const userType = 'employee';
      const expires = moment().add(1, 'hour');
      const type = 'ACCESS';

      const token = tokenService.generateToken(userId, userType, expires, type);

      // Try to verify as REFRESH token
      expect(() => tokenService.verifyToken(token, 'REFRESH')).toThrow(ApiError);
      expect(() => tokenService.verifyToken(token, 'REFRESH')).toThrow('Invalid token type');
    });

    it('should throw error for token signed with different secret', () => {
      const userId = 'user-202';
      const userType = 'customer';
      const expires = moment().add(1, 'hour');
      const type = 'ACCESS';
      const wrongSecret = 'wrong-secret';

      const token = tokenService.generateToken(userId, userType, expires, type, wrongSecret);

      expect(() => tokenService.verifyToken(token, type)).toThrow(ApiError);
    });
  });

  describe('generateAuthTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const userId = 'user-303';
      const userType = 'customer';

      const tokens = tokenService.generateAuthTokens(userId, userType);

      expect(tokens).toHaveProperty('access');
      expect(tokens).toHaveProperty('refresh');
      expect(tokens.access).toHaveProperty('token');
      expect(tokens.access).toHaveProperty('expires');
      expect(tokens.refresh).toHaveProperty('token');
      expect(tokens.refresh).toHaveProperty('expires');
    });

    it('should generate access token with correct expiration', () => {
      const userId = 'user-404';
      const userType = 'employee';

      const tokens = tokenService.generateAuthTokens(userId, userType);

      const expectedExpiration = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
      const actualExpiration = moment(tokens.access.expires);

      // Allow 1 second tolerance
      expect(actualExpiration.diff(expectedExpiration, 'seconds')).toBeLessThanOrEqual(1);
    });

    it('should generate refresh token with correct expiration', () => {
      const userId = 'user-505';
      const userType = 'customer';

      const tokens = tokenService.generateAuthTokens(userId, userType);

      const expectedExpiration = moment().add(config.jwt.refreshExpirationDays, 'days');
      const actualExpiration = moment(tokens.refresh.expires);

      // Allow 1 second tolerance
      expect(actualExpiration.diff(expectedExpiration, 'seconds')).toBeLessThanOrEqual(1);
    });

    it('should generate valid tokens that can be verified', () => {
      const userId = 'user-606';
      const userType = 'employee';

      const tokens = tokenService.generateAuthTokens(userId, userType);

      const accessPayload = tokenService.verifyToken(tokens.access.token, 'ACCESS');
      const refreshPayload = tokenService.verifyToken(tokens.refresh.token, 'REFRESH');

      expect(accessPayload.sub).toBe(userId);
      expect(accessPayload.userType).toBe(userType);
      expect(refreshPayload.sub).toBe(userId);
      expect(refreshPayload.userType).toBe(userType);
    });

    it('should generate different tokens for different users', () => {
      const user1Tokens = tokenService.generateAuthTokens('user-1', 'customer');
      const user2Tokens = tokenService.generateAuthTokens('user-2', 'employee');

      expect(user1Tokens.access.token).not.toBe(user2Tokens.access.token);
      expect(user1Tokens.refresh.token).not.toBe(user2Tokens.refresh.token);
    });
  });

  describe('generateResetPasswordToken', () => {
    it('should generate reset password token for customer', async () => {
      const phone = '0123456789';
      const userType = 'customer';
      const mockCustomer = {
        id: 'customer-123',
        fullName: 'Test Customer',
        phone,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer.findUnique = jest.fn().mockResolvedValue(mockCustomer);

      const token = await tokenService.generateResetPasswordToken(phone, userType);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { phone }
      });

      // Verify token payload
      const payload = tokenService.verifyToken(token, 'RESET_PASSWORD');
      expect(payload.sub).toBe(mockCustomer.id);
      expect(payload.userType).toBe(userType);
    });

    it('should generate reset password token for employee', async () => {
      const username = 'testemployee';
      const userType = 'employee';
      const mockEmployee = {
        id: 'employee-456',
        name: 'Test Employee',
        username,
        password: 'hashed-password',
        role: 'STAFF',
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee.findFirst = jest.fn().mockResolvedValue(mockEmployee);

      const token = await tokenService.generateResetPasswordToken(username, userType);

      expect(token).toBeDefined();
      expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith({
        where: { username }
      });

      const payload = tokenService.verifyToken(token, 'RESET_PASSWORD');
      expect(payload.sub).toBe(mockEmployee.id);
      expect(payload.userType).toBe(userType);
    });

    it('should throw error if customer not found', async () => {
      const phone = '9999999999';
      const userType = 'customer';

      // @ts-expect-error - Mock setup
      mockPrisma.customer.findUnique = jest.fn().mockResolvedValue(null);

      await expect(tokenService.generateResetPasswordToken(phone, userType)).rejects.toThrow(
        ApiError
      );
      await expect(tokenService.generateResetPasswordToken(phone, userType)).rejects.toThrow(
        'No user found with this identifier'
      );
    });

    it('should throw error if employee not found', async () => {
      const username = 'nonexistent';
      const userType = 'employee';

      // @ts-expect-error - Mock setup
      mockPrisma.employee.findFirst = jest.fn().mockResolvedValue(null);

      await expect(tokenService.generateResetPasswordToken(username, userType)).rejects.toThrow(
        ApiError
      );
      await expect(tokenService.generateResetPasswordToken(username, userType)).rejects.toThrow(
        'No user found with this identifier'
      );
    });

    it('should generate token with correct expiration time', async () => {
      const phone = '0987654321';
      const userType = 'customer';
      const mockCustomer = {
        id: 'customer-789',
        fullName: 'Test Customer',
        phone,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer.findUnique = jest.fn().mockResolvedValue(mockCustomer);

      const token = await tokenService.generateResetPasswordToken(phone, userType);

      const payload = jwt.verify(token, config.jwt.secret) as any;
      const tokenExpiration = moment.unix(payload.exp);
      const expectedExpiration = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');

      // Token should expire around the configured time (allow 1 second tolerance)
      expect(tokenExpiration.diff(expectedExpiration, 'seconds')).toBeLessThanOrEqual(1);
    });
  });
});

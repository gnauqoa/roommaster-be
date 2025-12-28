/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { AuthService } from '../../../src/services/auth.service';
import ApiError from '../../../src/utils/ApiError';
import * as encryption from '../../../src/utils/encryption';

// Mock the encryption utilities
jest.mock('../../../src/utils/encryption');

// Create mock services
const createMockPrisma = () => ({
  customer: {
    update: jest.fn()
  },
  employee: {
    update: jest.fn()
  }
});

const createMockTokenService = () => ({
  generateAuthTokens: jest.fn(),
  verifyToken: jest.fn(),
  generateToken: jest.fn()
});

const createMockCustomerService = () => ({
  getCustomerByPhone: jest.fn(),
  getCustomerById: jest.fn()
});

const createMockEmployeeService = () => ({
  getEmployeeByUsername: jest.fn(),
  getEmployeeById: jest.fn()
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockCustomerService: ReturnType<typeof createMockCustomerService>;
  let mockEmployeeService: ReturnType<typeof createMockEmployeeService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockTokenService = createMockTokenService();
    mockCustomerService = createMockCustomerService();
    mockEmployeeService = createMockEmployeeService();

    authService = new AuthService(
      mockPrisma as any,
      mockTokenService as any,
      mockCustomerService as any,
      mockEmployeeService as any
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('loginCustomerWithPhoneAndPassword', () => {
    it('should login customer with valid credentials', async () => {
      const phone = '0123456789';
      const password = 'password123';
      const mockCustomer = {
        id: 'customer-123',
        fullName: 'Test Customer',
        phone,
        password: 'hashed-password'
      };
      const mockTokens = {
        access: { token: 'access-token', expires: new Date() },
        refresh: { token: 'refresh-token', expires: new Date() }
      };

      // @ts-expect-error - Mock setup
      mockCustomerService.getCustomerByPhone = jest.fn().mockResolvedValue(mockCustomer);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(true);
      mockTokenService.generateAuthTokens = jest.fn().mockReturnValue(mockTokens);

      const result = await authService.loginCustomerWithPhoneAndPassword(phone, password);

      expect(result).toEqual({
        customer: mockCustomer,
        tokens: mockTokens
      });
      expect(mockCustomerService.getCustomerByPhone).toHaveBeenCalledWith(phone);
      expect(encryption.isPasswordMatch).toHaveBeenCalledWith(password, mockCustomer.password);
      expect(mockTokenService.generateAuthTokens).toHaveBeenCalledWith(mockCustomer.id, 'customer');
    });

    it('should throw error if customer not found', async () => {
      const phone = '9999999999';
      const password = 'password123';

      // @ts-expect-error - Mock setup
      mockCustomerService.getCustomerByPhone = jest.fn().mockResolvedValue(null);

      await expect(authService.loginCustomerWithPhoneAndPassword(phone, password)).rejects.toThrow(
        ApiError
      );
      await expect(authService.loginCustomerWithPhoneAndPassword(phone, password)).rejects.toThrow(
        'Incorrect phone or password'
      );
    });

    it('should throw error if password is incorrect', async () => {
      const phone = '0123456789';
      const password = 'wrongpassword';
      const mockCustomer = {
        id: 'customer-123',
        fullName: 'Test Customer',
        phone,
        password: 'hashed-password'
      };

      // @ts-expect-error - Mock setup
      mockCustomerService.getCustomerByPhone = jest.fn().mockResolvedValue(mockCustomer);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(false);

      await expect(authService.loginCustomerWithPhoneAndPassword(phone, password)).rejects.toThrow(
        ApiError
      );
      await expect(authService.loginCustomerWithPhoneAndPassword(phone, password)).rejects.toThrow(
        'Incorrect phone or password'
      );
    });
  });

  describe('loginEmployeeWithUsernameAndPassword', () => {
    it('should login employee with valid credentials', async () => {
      const username = 'testemployee';
      const password = 'password123';
      const mockEmployee = {
        id: 'employee-456',
        name: 'Test Employee',
        username,
        password: 'hashed-password',
        role: 'STAFF'
      };
      const mockTokens = {
        access: { token: 'access-token', expires: new Date() },
        refresh: { token: 'refresh-token', expires: new Date() }
      };

      // @ts-expect-error - Mock setup
      mockEmployeeService.getEmployeeByUsername = jest.fn().mockResolvedValue(mockEmployee);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(true);
      mockTokenService.generateAuthTokens = jest.fn().mockReturnValue(mockTokens);

      const result = await authService.loginEmployeeWithUsernameAndPassword(username, password);

      expect(result).toEqual({
        employee: mockEmployee,
        tokens: mockTokens
      });
      expect(mockEmployeeService.getEmployeeByUsername).toHaveBeenCalledWith(username);
      expect(encryption.isPasswordMatch).toHaveBeenCalledWith(password, mockEmployee.password);
      expect(mockTokenService.generateAuthTokens).toHaveBeenCalledWith(mockEmployee.id, 'employee');
    });

    it('should throw error if employee not found', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      // @ts-expect-error - Mock setup
      mockEmployeeService.getEmployeeByUsername = jest.fn().mockResolvedValue(null);

      await expect(
        authService.loginEmployeeWithUsernameAndPassword(username, password)
      ).rejects.toThrow(ApiError);
      await expect(
        authService.loginEmployeeWithUsernameAndPassword(username, password)
      ).rejects.toThrow('Incorrect username or password');
    });

    it('should throw error if password is incorrect', async () => {
      const username = 'testemployee';
      const password = 'wrongpassword';
      const mockEmployee = {
        id: 'employee-456',
        name: 'Test Employee',
        username,
        password: 'hashed-password',
        role: 'STAFF'
      };

      // @ts-expect-error - Mock setup
      mockEmployeeService.getEmployeeByUsername = jest.fn().mockResolvedValue(mockEmployee);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginEmployeeWithUsernameAndPassword(username, password)
      ).rejects.toThrow(ApiError);
      await expect(
        authService.loginEmployeeWithUsernameAndPassword(username, password)
      ).rejects.toThrow('Incorrect username or password');
    });
  });

  describe('logout', () => {
    it('should verify refresh token on logout', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 'user-123', userType: 'customer', type: 'REFRESH' };

      mockTokenService.verifyToken = jest.fn().mockReturnValue(mockPayload);

      await authService.logout(refreshToken);

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(refreshToken, 'REFRESH');
    });

    it('should throw error if refresh token is invalid', async () => {
      const refreshToken = 'invalid-token';

      mockTokenService.verifyToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.logout(refreshToken)).rejects.toThrow(ApiError);
      await expect(authService.logout(refreshToken)).rejects.toThrow('Token not found');
    });
  });

  describe('refreshAuth', () => {
    it('should generate new tokens with valid refresh token', () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 'user-789', userType: 'employee', type: 'REFRESH' };
      const mockNewTokens = {
        access: { token: 'new-access-token', expires: new Date() },
        refresh: { token: 'new-refresh-token', expires: new Date() }
      };

      mockTokenService.verifyToken = jest.fn().mockReturnValue(mockPayload);
      mockTokenService.generateAuthTokens = jest.fn().mockReturnValue(mockNewTokens);

      const result = authService.refreshAuth(refreshToken);

      expect(result).toEqual(mockNewTokens);
      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(refreshToken, 'REFRESH');
      expect(mockTokenService.generateAuthTokens).toHaveBeenCalledWith('user-789', 'employee');
    });

    it('should throw error if refresh token is invalid', () => {
      const refreshToken = 'invalid-token';

      mockTokenService.verifyToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.refreshAuth(refreshToken)).toThrow(ApiError);
      expect(() => authService.refreshAuth(refreshToken)).toThrow('Invalid refresh token');
    });

    it('should throw error if token payload is missing userId', () => {
      const refreshToken = 'token-without-user-id';
      const mockPayload = { userType: 'customer', type: 'REFRESH' }; // Missing sub

      mockTokenService.verifyToken = jest.fn().mockReturnValue(mockPayload);

      expect(() => authService.refreshAuth(refreshToken)).toThrow(ApiError);
      expect(() => authService.refreshAuth(refreshToken)).toThrow('Invalid refresh token');
    });
  });

  describe('resetPassword', () => {
    it('should reset password for customer with valid token', async () => {
      const resetToken = 'valid-reset-token';
      const newPassword = 'newpassword123';
      const mockPayload = { sub: 'customer-123', userType: 'customer', type: 'RESET_PASSWORD' };
      const hashedPassword = 'new-hashed-password';

      mockTokenService.verifyToken = jest.fn().mockReturnValue(mockPayload);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.customer.update = jest.fn().mockResolvedValue({});

      await authService.resetPassword(resetToken, newPassword);

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(resetToken, 'RESET_PASSWORD');
      expect(encryption.encryptPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        data: { password: hashedPassword }
      });
    });

    it('should reset password for employee with valid token', async () => {
      const resetToken = 'valid-reset-token';
      const newPassword = 'newpassword123';
      const mockPayload = { sub: 'employee-456', userType: 'employee', type: 'RESET_PASSWORD' };
      const hashedPassword = 'new-hashed-password';

      mockTokenService.verifyToken = jest.fn().mockReturnValue(mockPayload);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.employee.update = jest.fn().mockResolvedValue({});

      await authService.resetPassword(resetToken, newPassword);

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(resetToken, 'RESET_PASSWORD');
      expect(encryption.encryptPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'employee-456' },
        data: { password: hashedPassword }
      });
    });

    it('should throw error if reset token is invalid', async () => {
      const resetToken = 'invalid-token';
      const newPassword = 'newpassword123';

      mockTokenService.verifyToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow(ApiError);
      await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow(
        'Password reset failed'
      );
    });
  });

  describe('changePassword', () => {
    it('should change password for customer with correct current password', async () => {
      const userId = 'customer-123';
      const userType = 'customer';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword123';
      const mockCustomer = {
        id: userId,
        fullName: 'Test Customer',
        phone: '0123456789',
        password: 'old-hashed-password'
      };
      const hashedPassword = 'new-hashed-password';

      // @ts-expect-error - Mock setup
      mockCustomerService.getCustomerById = jest.fn().mockResolvedValue(mockCustomer);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(true);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.customer.update = jest.fn().mockResolvedValue({});

      await authService.changePassword(userId, userType, currentPassword, newPassword);

      expect(mockCustomerService.getCustomerById).toHaveBeenCalledWith(userId);
      expect(encryption.isPasswordMatch).toHaveBeenCalledWith(
        currentPassword,
        mockCustomer.password
      );
      expect(encryption.encryptPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword }
      });
    });

    it('should change password for employee with correct current password', async () => {
      const userId = 'employee-456';
      const userType = 'employee';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword123';
      const mockEmployee = {
        id: userId,
        name: 'Test Employee',
        username: 'testemployee',
        password: 'old-hashed-password',
        role: 'STAFF'
      };
      const hashedPassword = 'new-hashed-password';

      // @ts-expect-error - Mock setup
      mockEmployeeService.getEmployeeById = jest.fn().mockResolvedValue(mockEmployee);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(true);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.employee.update = jest.fn().mockResolvedValue({});

      await authService.changePassword(userId, userType, currentPassword, newPassword);

      expect(mockEmployeeService.getEmployeeById).toHaveBeenCalledWith(userId);
      expect(encryption.isPasswordMatch).toHaveBeenCalledWith(
        currentPassword,
        mockEmployee.password
      );
      expect(encryption.encryptPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword }
      });
    });

    it('should throw error if current password is incorrect', async () => {
      const userId = 'customer-123';
      const userType = 'customer';
      const currentPassword = 'wrongpassword';
      const newPassword = 'newpassword123';
      const mockCustomer = {
        id: userId,
        fullName: 'Test Customer',
        phone: '0123456789',
        password: 'hashed-password'
      };

      // @ts-expect-error - Mock setup
      mockCustomerService.getCustomerById = jest.fn().mockResolvedValue(mockCustomer);
      // @ts-expect-error - Mock setup
      (encryption.isPasswordMatch as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword(userId, userType, currentPassword, newPassword)
      ).rejects.toThrow(ApiError);
      await expect(
        authService.changePassword(userId, userType, currentPassword, newPassword)
      ).rejects.toThrow('Incorrect current password');
    });
  });
});

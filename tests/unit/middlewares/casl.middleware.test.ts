/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-require-imports */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import {
  attachAbilities,
  canAccessScreen,
  authorize,
  authorizeAny
} from '@/middlewares/casl.middleware';
import ApiError from '@/utils/ApiError';

// Mock the dependencies
jest.mock('@/config/casl-ability', () => ({
  defineAbilitiesFor: jest.fn()
}));

jest.mock('@/prisma', () => ({}));

import { defineAbilitiesFor } from '@/config/casl-ability';

const mockDefineAbilitiesFor = defineAbilitiesFor as jest.MockedFunction<typeof defineAbilitiesFor>;

describe('CASL Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      employee: undefined,
      ability: undefined
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('attachAbilities', () => {
    it('should skip if no employee in request', async () => {
      mockReq.employee = undefined;

      await attachAbilities(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith();
      expect(defineAbilitiesFor).not.toHaveBeenCalled();
    });

    it('should skip if employee has no roleId', async () => {
      mockReq.employee = { id: 'emp-1', roleId: null } as any;

      await attachAbilities(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith();
      expect(defineAbilitiesFor).not.toHaveBeenCalled();
    });

    it('should attach abilities when employee has roleId', async () => {
      const mockAbility = { can: jest.fn() };
      mockReq.employee = { id: 'emp-1', roleId: 'role-123' } as any;
      mockDefineAbilitiesFor.mockResolvedValue(mockAbility as any);

      await attachAbilities(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(defineAbilitiesFor).toHaveBeenCalledWith('role-123', expect.anything());
      expect(mockReq.ability).toBe(mockAbility);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      mockReq.employee = { id: 'emp-1', roleId: 'role-123' } as any;
      mockDefineAbilitiesFor.mockRejectedValue(error);

      await attachAbilities(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('canAccessScreen', () => {
    it('should return error if no ability attached', () => {
      mockReq.ability = undefined;
      const middleware = canAccessScreen('Booking');

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(httpStatus.UNAUTHORIZED);
      expect(error.message).toBe('Authentication required');
    });

    it('should return forbidden error if cannot access screen', () => {
      mockReq.ability = { can: jest.fn().mockReturnValue(false) } as any;
      const middleware = canAccessScreen('Settings');

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.ability!.can).toHaveBeenCalledWith('access', 'Settings');
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(httpStatus.FORBIDDEN);
      expect(error.message).toContain('Access denied to Settings screen');
    });

    it('should call next if can access screen', () => {
      mockReq.ability = { can: jest.fn().mockReturnValue(true) } as any;
      const middleware = canAccessScreen('Booking');

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.ability!.can).toHaveBeenCalledWith('access', 'Booking');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('authorize', () => {
    it('should return error if no ability attached', () => {
      mockReq.ability = undefined;
      const middleware = authorize('create', 'Booking');

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should return forbidden error if action not allowed', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ForbiddenError } = require('@casl/ability');
      const mockAbility = {
        can: jest.fn().mockReturnValue(false)
      };

      mockReq.ability = mockAbility as any;
      jest.spyOn(ForbiddenError, 'from').mockReturnValue({
        throwUnlessCan: jest.fn().mockImplementation(() => {
          throw new ForbiddenError('Cannot delete Employee');
        })
      });

      const middleware = authorize('delete', 'Employee');

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(httpStatus.FORBIDDEN);
      expect(error.message).toContain('Cannot delete Employee');
    });

    it('should call next if action is allowed', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ForbiddenError } = require('@casl/ability');
      const mockAbility = {
        can: jest.fn().mockReturnValue(true)
      };
      mockReq.ability = mockAbility as any;

      jest.spyOn(ForbiddenError, 'from').mockReturnValue({
        throwUnlessCan: jest.fn()
      });

      const middleware = authorize('create', 'Booking');

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('authorizeAny', () => {
    it('should return error if no ability attached', () => {
      mockReq.ability = undefined;
      const middleware = authorizeAny([
        { action: 'read', subject: 'Booking' },
        { action: 'read', subject: 'Room' }
      ]);

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should call next if at least one permission is granted', () => {
      mockReq.ability = {
        can: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true)
      } as any;

      const middleware = authorizeAny([
        { action: 'delete', subject: 'Booking' },
        { action: 'read', subject: 'Booking' }
      ]);

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return forbidden if no permissions are granted', () => {
      mockReq.ability = {
        can: jest.fn().mockReturnValue(false)
      } as any;

      const middleware = authorizeAny([
        { action: 'delete', subject: 'Employee' },
        { action: 'delete', subject: 'Room' }
      ]);

      middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(httpStatus.FORBIDDEN);
    });
  });
});

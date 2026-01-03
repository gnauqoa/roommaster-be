/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { errorConverter, errorHandler } from '@/middlewares/error';
import ApiError from '@/utils/ApiError';
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';

// Mock config and logger
jest.mock('@/config/env', () => ({
  default: {
    env: 'test'
  }
}));

jest.mock('../../../src/config/logger', () => ({
  default: {
    error: jest.fn()
  }
}));

describe('error middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      send: jest.fn() as any,
      locals: {}
    };
    mockNext = jest.fn() as any;
  });

  describe('errorConverter', () => {
    it('should convert non-ApiError to ApiError', () => {
      const error = new Error('Test error');

      errorConverter(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const convertedError = (mockNext as any).mock.calls[0][0];
      expect(convertedError.message).toBe('Test error');
      expect(convertedError.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should pass through ApiError unchanged', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Bad request');

      errorConverter(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should convert Prisma error to BAD_REQUEST', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Prisma error', {
        code: 'P2002',
        clientVersion: '4.0.0'
      });

      errorConverter(prismaError as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const convertedError = (mockNext as any).mock.calls[0][0];
      expect(convertedError.statusCode).toBe(httpStatus.BAD_REQUEST);
    });

    it('should use BAD_REQUEST for errors with statusCode', () => {
      const error: any = new Error('Custom error');
      error.statusCode = httpStatus.NOT_FOUND;

      errorConverter(error, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalled();
      const convertedError = (mockNext as any).mock.calls[0][0];
      // Error converter uses BAD_REQUEST for errors with statusCode
      expect(convertedError.statusCode).toBe(httpStatus.BAD_REQUEST);
    });

    it('should preserve error stack', () => {
      const error = new Error('Test error');
      const originalStack = error.stack;

      errorConverter(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      const convertedError = (mockNext as any).mock.calls[0][0];
      expect(convertedError.stack).toBe(originalStack);
    });
  });

  describe('errorHandler', () => {
    it('should send error response with status code and message', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Bad request');

      errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(mockRes.send).toHaveBeenCalledWith({
        code: httpStatus.BAD_REQUEST,
        message: 'Bad request'
      });
    });

    it('should set errorMessage in res.locals', () => {
      const error = new ApiError(httpStatus.NOT_FOUND, 'Not found');

      errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRes.locals?.errorMessage).toBe('Not found');
    });

    it('should handle 500 errors', () => {
      const error = new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');

      errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should handle 401 unauthorized errors', () => {
      const error = new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

      errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.UNAUTHORIZED);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unauthorized'
        })
      );
    });

    it('should handle 403 forbidden errors', () => {
      const error = new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.FORBIDDEN);
    });
  });
});

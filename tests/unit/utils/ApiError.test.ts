import { describe, expect, it } from '@jest/globals';
import ApiError from '@/utils/ApiError';
import httpStatus from 'http-status';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an error with status code and message', () => {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = 'Test error message';

      const error = new ApiError(statusCode, message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(statusCode);
      expect(error.message).toBe(message);
      expect(error.isOperational).toBe(true);
    });

    it('should set isOperational to true by default', () => {
      const error = new ApiError(httpStatus.NOT_FOUND, 'Not found');

      expect(error.isOperational).toBe(true);
    });

    it('should allow custom isOperational value', () => {
      const error = new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error', false);

      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace when not provided', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Bad request');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });

    it('should use custom stack trace when provided', () => {
      const customStack = 'Custom stack trace';
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Bad request', true, customStack);

      expect(error.stack).toBe(customStack);
    });

    it('should handle undefined message', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, undefined);

      expect(error.message).toBe('');
      expect(error.statusCode).toBe(httpStatus.BAD_REQUEST);
    });

    it('should create error with 404 status', () => {
      const error = new ApiError(httpStatus.NOT_FOUND, 'Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should create error with 500 status', () => {
      const error = new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal error');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal error');
    });

    it('should create error with 401 status', () => {
      const error = new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create error with 403 status', () => {
      const error = new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });
  });
});

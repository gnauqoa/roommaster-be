/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import validate from '@/middlewares/validate';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '@/utils/ApiError';
import httpStatus from 'http-status';

describe('validate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    mockRes = {};
    mockNext = jest.fn() as any;
  });

  describe('validate', () => {
    it('should pass validation with valid data', () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().required()
        })
      };

      mockReq.body = { name: 'John', age: 25 };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should fail validation with missing required field', () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().required()
        })
      };

      mockReq.body = { name: 'John' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.statusCode).toBe(httpStatus.BAD_REQUEST);
      expect(error.message).toContain('email');
    });

    it('should fail validation with invalid type', () => {
      const schema = {
        body: Joi.object({
          age: Joi.number().required()
        })
      };

      mockReq.body = { age: 'not a number' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.statusCode).toBe(httpStatus.BAD_REQUEST);
    });

    it('should validate query parameters', () => {
      const schema = {
        query: Joi.object({
          page: Joi.number().required(),
          limit: Joi.number().required()
        })
      };

      mockReq.query = { page: '1', limit: '10' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate route params', () => {
      const schema = {
        params: Joi.object({
          id: Joi.string().required()
        })
      };

      mockReq.params = { id: '123' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate multiple parts (body, query, params)', () => {
      const schema = {
        params: Joi.object({
          id: Joi.string().required()
        }),
        query: Joi.object({
          page: Joi.number().optional()
        }),
        body: Joi.object({
          name: Joi.string().required()
        })
      };

      mockReq.params = { id: '123' };
      mockReq.query = { page: '1' };
      mockReq.body = { name: 'Test' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return all validation errors', () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          age: Joi.number().min(18).required()
        })
      };

      mockReq.body = { age: 15 };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('name');
      expect(error.message).toContain('email');
    });

    it('should handle empty schema', () => {
      const schema = {};

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject unknown fields', () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required()
        })
      };

      mockReq.body = { name: 'John', extraField: 'should be rejected' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should validate optional fields', () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          nickname: Joi.string().optional()
        })
      };

      mockReq.body = { name: 'John' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext as any);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});

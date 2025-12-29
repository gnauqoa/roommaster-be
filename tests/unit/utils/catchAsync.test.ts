/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import catchAsync from '../../../src/utils/catchAsync';
import { Request, Response } from 'express';

describe('catchAsync', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    };
    mockNext = jest.fn() as any;
  });

  it('should call the wrapped async function', async () => {
    const mockFn = (jest.fn() as any).mockResolvedValue(undefined);
    const wrappedFn = catchAsync(mockFn as any);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
  });

  it('should not call next when async function succeeds', async () => {
    const mockFn = (jest.fn() as any).mockResolvedValue(undefined);
    const wrappedFn = catchAsync(mockFn as any);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next with error when async function throws', async () => {
    const error = new Error('Test error');
    const mockFn = (jest.fn() as any).mockRejectedValue(error);
    const wrappedFn = catchAsync(mockFn as any);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should not catch synchronous errors (they will throw)', () => {
    const error = new Error('Sync error');
    const mockFn = jest.fn(() => {
      throw error;
    }) as any;
    const wrappedFn = catchAsync(mockFn as any);

    // Synchronous errors are NOT caught by the current implementation
    expect(() => {
      wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow('Sync error');

    // next should not be called since the error was thrown synchronously
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass through all arguments to wrapped function', async () => {
    const mockFn = (jest.fn() as any).mockResolvedValue(undefined);
    const wrappedFn = catchAsync(mockFn as any);

    const customReq = { custom: 'data' } as any;
    const customRes = { custom: 'response' } as any;
    const customNext = jest.fn();

    await wrappedFn(customReq, customRes, customNext as any);

    expect(mockFn).toHaveBeenCalledWith(customReq, customRes, customNext);
  });
});

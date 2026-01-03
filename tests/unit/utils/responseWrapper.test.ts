/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from '@jest/globals';
import {
  sendData,
  sendPaginatedData,
  sendNoContent,
  calculatePagination
} from '@/utils/responseWrapper';
import { Response } from 'express';
import httpStatus from 'http-status';

describe('responseWrapper', () => {
  describe('sendData', () => {
    it('should send response with data and default status 200', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const testData = { id: 1, name: 'Test' };
      sendData(mockRes, testData);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.send).toHaveBeenCalledWith({ data: testData });
    });

    it('should send response with custom status code', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const testData = { id: 1 };
      sendData(mockRes, testData, httpStatus.CREATED);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.CREATED);
      expect(mockRes.send).toHaveBeenCalledWith({ data: testData });
    });

    it('should handle null data', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      sendData(mockRes, null);

      expect(mockRes.send).toHaveBeenCalledWith({ data: null });
    });

    it('should handle array data', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const testData = [1, 2, 3];
      sendData(mockRes, testData);

      expect(mockRes.send).toHaveBeenCalledWith({ data: testData });
    });

    it('should handle empty object', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      sendData(mockRes, {});

      expect(mockRes.send).toHaveBeenCalledWith({ data: {} });
    });
  });

  describe('sendPaginatedData', () => {
    it('should send paginated response with default status 200', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const items = [{ id: 1 }, { id: 2 }];
      const pagination = {
        totalItems: 100,
        perPage: 20,
        currentPage: 1,
        totalPages: 5
      };

      sendPaginatedData(mockRes, items, pagination);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.send).toHaveBeenCalledWith({
        data: {
          items,
          totalItems: 100,
          perPage: 20,
          currentPage: 1,
          totalPages: 5
        }
      });
    });

    it('should send paginated response with custom status', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const items = [{ id: 1 }];
      const pagination = {
        totalItems: 1,
        perPage: 10,
        currentPage: 1,
        totalPages: 1
      };

      sendPaginatedData(mockRes, items, pagination, httpStatus.CREATED);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.CREATED);
    });

    it('should handle empty items array', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const items: any[] = [];
      const pagination = {
        totalItems: 0,
        perPage: 10,
        currentPage: 1,
        totalPages: 0
      };

      sendPaginatedData(mockRes, items, pagination);

      expect(mockRes.send).toHaveBeenCalledWith({
        data: {
          items: [],
          totalItems: 0,
          perPage: 10,
          currentPage: 1,
          totalPages: 0
        }
      });
    });

    it('should handle large page numbers', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      const items = [{ id: 50 }];
      const pagination = {
        totalItems: 500,
        perPage: 10,
        currentPage: 50,
        totalPages: 50
      };

      sendPaginatedData(mockRes, items, pagination);

      expect(mockRes.send).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currentPage: 50,
          totalPages: 50
        })
      });
    });
  });

  describe('sendNoContent', () => {
    it('should send 204 no content response', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any as Response;

      sendNoContent(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('calculatePagination', () => {
    it('should calculate pagination with default page and limit', () => {
      const result = calculatePagination(100);

      expect(result).toEqual({
        totalItems: 100,
        perPage: 10,
        currentPage: 1,
        totalPages: 10
      });
    });

    it('should calculate pagination with custom page and limit', () => {
      const result = calculatePagination(50, 2, 20);

      expect(result).toEqual({
        totalItems: 50,
        perPage: 20,
        currentPage: 2,
        totalPages: 3
      });
    });

    it('should handle zero total items', () => {
      const result = calculatePagination(0, 1, 10);

      expect(result).toEqual({
        totalItems: 0,
        perPage: 10,
        currentPage: 1,
        totalPages: 0
      });
    });

    it('should round up total pages', () => {
      const result = calculatePagination(25, 1, 10);

      expect(result).toEqual({
        totalItems: 25,
        perPage: 10,
        currentPage: 1,
        totalPages: 3 // Math.ceil(25/10) = 3
      });
    });

    it('should handle single item', () => {
      const result = calculatePagination(1, 1, 10);

      expect(result).toEqual({
        totalItems: 1,
        perPage: 10,
        currentPage: 1,
        totalPages: 1
      });
    });

    it('should handle exact page division', () => {
      const result = calculatePagination(100, 3, 10);

      expect(result).toEqual({
        totalItems: 100,
        perPage: 10,
        currentPage: 3,
        totalPages: 10
      });
    });

    it('should handle large total items', () => {
      const result = calculatePagination(10000, 50, 100);

      expect(result).toEqual({
        totalItems: 10000,
        perPage: 100,
        currentPage: 50,
        totalPages: 100
      });
    });
  });
});

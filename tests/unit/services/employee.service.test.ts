/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { EmployeeService } from '../../../src/services/employee.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';
import * as encryption from '../../../src/utils/encryption';

// Mock the encryption utilities
jest.mock('../../../src/utils/encryption');

describe('EmployeeService', () => {
  let employeeService: EmployeeService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    employeeService = new EmployeeService(mockPrisma as PrismaClient);
    jest.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('should create a new employee successfully', async () => {
      const employeeData = {
        name: 'John Doe',
        username: 'johndoe',
        password: 'password123',
        role: 'STAFF'
      };
      const hashedPassword = 'hashed-password-123';
      const createdEmployee = {
        id: 'employee-123',
        name: employeeData.name,
        username: employeeData.username,
        password: hashedPassword,
        role: employeeData.role,
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.create = jest.fn().mockResolvedValue(createdEmployee);

      const result = await employeeService.createEmployee(employeeData);

      expect(result).toEqual(createdEmployee);
      expect(mockPrisma.employee!.findUnique).toHaveBeenCalledWith({
        where: { username: employeeData.username }
      });
      expect(encryption.encryptPassword).toHaveBeenCalledWith(employeeData.password);
      expect(mockPrisma.employee!.create).toHaveBeenCalledWith({
        data: {
          name: employeeData.name,
          username: employeeData.username,
          password: hashedPassword,
          role: employeeData.role
        }
      });
    });

    it('should use default role STAFF if not provided', async () => {
      const employeeData = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'password123'
      };
      const hashedPassword = 'hashed-password-456';

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.create = jest.fn().mockResolvedValue({
        id: 'employee-456',
        ...employeeData,
        password: hashedPassword,
        role: 'STAFF',
        updatedAt: new Date()
      });

      await employeeService.createEmployee(employeeData);

      expect(mockPrisma.employee!.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'STAFF'
        })
      });
    });

    it('should throw error if username already exists', async () => {
      const employeeData = {
        name: 'Duplicate User',
        username: 'existing',
        password: 'password123'
      };
      const existingEmployee = {
        id: 'employee-789',
        name: 'Existing Employee',
        username: 'existing',
        password: 'hashed',
        role: 'STAFF',
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(existingEmployee);

      await expect(employeeService.createEmployee(employeeData)).rejects.toThrow(ApiError);
      await expect(employeeService.createEmployee(employeeData)).rejects.toThrow(
        'Username already exists'
      );
      expect(mockPrisma.employee!.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllEmployees', () => {
    it('should return paginated employees', async () => {
      const mockEmployees = [
        {
          id: 'emp-1',
          name: 'Employee 1',
          username: 'emp1',
          role: 'STAFF',
          updatedAt: new Date()
        },
        {
          id: 'emp-2',
          name: 'Employee 2',
          username: 'emp2',
          role: 'ADMIN',
          updatedAt: new Date()
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findMany = jest.fn().mockResolvedValue(mockEmployees);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.count = jest.fn().mockResolvedValue(2);

      const result = await employeeService.getAllEmployees();

      expect(result).toEqual({
        data: mockEmployees,
        total: 2,
        page: 1,
        limit: 10
      });
    });

    it('should apply search filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.count = jest.fn().mockResolvedValue(0);

      await employeeService.getAllEmployees({ search: 'john' });

      expect(mockPrisma.employee!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: { contains: 'john', mode: 'insensitive' }
              }),
              expect.objectContaining({
                username: { contains: 'john', mode: 'insensitive' }
              })
            ])
          })
        })
      );
    });

    it('should apply role filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.count = jest.fn().mockResolvedValue(0);

      await employeeService.getAllEmployees({ role: 'ADMIN' });

      expect(mockPrisma.employee!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'ADMIN'
          })
        })
      );
    });

    it('should apply pagination options', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.count = jest.fn().mockResolvedValue(0);

      await employeeService.getAllEmployees({}, { page: 2, limit: 5 });

      expect(mockPrisma.employee!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5
        })
      );
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee by ID', async () => {
      const mockEmployee = {
        id: 'employee-123',
        name: 'Test Employee',
        username: 'testuser',
        password: 'hashed',
        role: 'STAFF',
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(mockEmployee);

      const result = await employeeService.getEmployeeById('employee-123');

      expect(result).toEqual(mockEmployee);
      expect(mockPrisma.employee!.findUnique).toHaveBeenCalledWith({
        where: { id: 'employee-123' }
      });
    });

    it('should throw error if employee not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(employeeService.getEmployeeById('non-existent')).rejects.toThrow(ApiError);
      await expect(employeeService.getEmployeeById('non-existent')).rejects.toThrow(
        'Employee not found'
      );
    });
  });

  describe('getEmployeeByUsername', () => {
    it('should return employee by username', async () => {
      const mockEmployee = {
        id: 'employee-456',
        name: 'Test Employee',
        username: 'testuser',
        password: 'hashed',
        role: 'STAFF',
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(mockEmployee);

      const result = await employeeService.getEmployeeByUsername('testuser');

      expect(result).toEqual(mockEmployee);
      expect(mockPrisma.employee!.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' }
      });
    });

    it('should return null if employee not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(null);

      const result = await employeeService.getEmployeeByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateEmployee', () => {
    it('should update employee successfully', async () => {
      const employeeId = 'employee-123';
      const updateData = {
        name: 'Updated Name',
        role: 'ADMIN'
      };
      const existingEmployee = {
        id: employeeId,
        name: 'Old Name',
        username: 'testuser',
        password: 'hashed',
        role: 'STAFF',
        updatedAt: new Date()
      };
      const updatedEmployee = {
        ...existingEmployee,
        ...updateData
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(existingEmployee);
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.update = jest.fn().mockResolvedValue(updatedEmployee);

      const result = await employeeService.updateEmployee(employeeId, updateData);

      expect(result).toEqual(updatedEmployee);
      expect(mockPrisma.employee!.update).toHaveBeenCalledWith({
        where: { id: employeeId },
        data: updateData
      });
    });

    it('should throw error if employee not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        employeeService.updateEmployee('non-existent', { name: 'New Name' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteEmployee', () => {
    it('should delete employee successfully', async () => {
      const employeeId = 'employee-123';
      const mockEmployee = {
        id: employeeId,
        name: 'Test Employee',
        username: 'testuser',
        password: 'hashed',
        role: 'STAFF',
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(mockEmployee);
      // @ts-expect-error - Mock setup
      mockPrisma.transaction = {
        ...mockPrisma.transaction,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(0)
      } as any;
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.delete = jest.fn().mockResolvedValue(mockEmployee);

      await employeeService.deleteEmployee(employeeId);

      expect(mockPrisma.employee!.delete).toHaveBeenCalledWith({
        where: { id: employeeId }
      });
    });

    it('should throw error if employee has transaction history', async () => {
      const employeeId = 'employee-123';
      const mockEmployee = {
        id: employeeId,
        name: 'Test Employee',
        username: 'testuser',
        password: 'hashed',
        role: 'STAFF',
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(mockEmployee);
      // @ts-expect-error - Mock setup
      mockPrisma.transaction = {
        ...mockPrisma.transaction,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(5)
      } as any;

      await expect(employeeService.deleteEmployee(employeeId)).rejects.toThrow(ApiError);
      await expect(employeeService.deleteEmployee(employeeId)).rejects.toThrow(
        'Cannot delete employee with transaction history'
      );
      expect(mockPrisma.employee!.delete).not.toHaveBeenCalled();
    });

    it('should throw error if employee not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.employee!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(employeeService.deleteEmployee('non-existent')).rejects.toThrow(ApiError);
    });
  });
});

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { CustomerService } from '@/services/customer.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient } from '@prisma/client';
import ApiError from '@/utils/ApiError';
import * as encryption from '@/utils/encryption';

// Mock the encryption utilities
jest.mock('@/utils/encryption');

describe('CustomerService', () => {
  let customerService: CustomerService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    customerService = new CustomerService(mockPrisma as PrismaClient);
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a new customer successfully', async () => {
      const customerData = {
        fullName: 'John Doe',
        phone: '0123456789',
        password: 'password123',
        email: 'john@example.com',
        idNumber: '123456789',
        address: '123 Main St'
      };
      const hashedPassword = 'hashed-password-123';
      const createdCustomer = {
        id: 'customer-123',
        ...customerData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.create = jest.fn().mockResolvedValue(createdCustomer);

      const result = await customerService.createCustomer(customerData);

      expect(result).toEqual(createdCustomer);
      expect(mockPrisma.customer!.findUnique).toHaveBeenCalledWith({
        where: { phone: customerData.phone }
      });
      expect(encryption.encryptPassword).toHaveBeenCalledWith(customerData.password);
      expect(mockPrisma.customer!.create).toHaveBeenCalledWith({
        data: {
          ...customerData,
          password: hashedPassword
        }
      });
    });

    it('should create customer with minimal data', async () => {
      const customerData = {
        fullName: 'Jane Doe',
        phone: '0987654321',
        password: 'password456'
      };
      const hashedPassword = 'hashed-password-456';

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      (encryption.encryptPassword as jest.Mock).mockResolvedValue(hashedPassword);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.create = jest.fn().mockResolvedValue({
        id: 'customer-456',
        ...customerData,
        email: null,
        idNumber: null,
        address: null,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await customerService.createCustomer(customerData);

      expect(mockPrisma.customer!.create).toHaveBeenCalled();
    });

    it('should throw error if phone already exists', async () => {
      const customerData = {
        fullName: 'Duplicate User',
        phone: '0123456789',
        password: 'password123'
      };
      const existingCustomer = {
        id: 'customer-789',
        fullName: 'Existing Customer',
        phone: '0123456789',
        email: null,
        idNumber: null,
        address: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(existingCustomer);

      await expect(customerService.createCustomer(customerData)).rejects.toThrow(ApiError);
      await expect(customerService.createCustomer(customerData)).rejects.toThrow(
        'Phone number already registered'
      );
      expect(mockPrisma.customer!.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllCustomers', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          fullName: 'Customer 1',
          phone: '0111111111',
          email: 'cust1@example.com',
          idNumber: '111',
          address: 'Address 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { bookings: 2 }
        },
        {
          id: 'cust-2',
          fullName: 'Customer 2',
          phone: '0222222222',
          email: 'cust2@example.com',
          idNumber: '222',
          address: 'Address 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { bookings: 0 }
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findMany = jest.fn().mockResolvedValue(mockCustomers);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.count = jest.fn().mockResolvedValue(2);

      const result = await customerService.getAllCustomers();

      expect(result).toEqual({
        data: mockCustomers,
        total: 2,
        page: 1,
        limit: 10
      });
    });

    it('should apply search filter on name, phone, and email', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.count = jest.fn().mockResolvedValue(0);

      await customerService.getAllCustomers({ search: 'john' });

      expect(mockPrisma.customer!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                fullName: { contains: 'john', mode: 'insensitive' }
              }),
              expect.objectContaining({
                phone: { contains: 'john' }
              }),
              expect.objectContaining({
                email: { contains: 'john', mode: 'insensitive' }
              })
            ])
          })
        })
      );
    });

    it('should apply pagination options', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.count = jest.fn().mockResolvedValue(0);

      await customerService.getAllCustomers({}, { page: 3, limit: 20 });

      expect(mockPrisma.customer!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20
        })
      );
    });
  });

  describe('getCustomerById', () => {
    it('should return customer by ID', async () => {
      const mockCustomer = {
        id: 'customer-123',
        fullName: 'Test Customer',
        phone: '0123456789',
        email: 'test@example.com',
        idNumber: '123',
        address: 'Test Address',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerById('customer-123');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer!.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-123' }
      });
    });

    it('should throw error if customer not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(customerService.getCustomerById('non-existent')).rejects.toThrow(ApiError);
      await expect(customerService.getCustomerById('non-existent')).rejects.toThrow(
        'Customer not found'
      );
    });
  });

  describe('getCustomerByPhone', () => {
    it('should return customer by phone', async () => {
      const mockCustomer = {
        id: 'customer-456',
        fullName: 'Test Customer',
        phone: '0123456789',
        email: 'test@example.com',
        idNumber: '123',
        address: 'Test Address',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerByPhone('0123456789');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer!.findUnique).toHaveBeenCalledWith({
        where: { phone: '0123456789' }
      });
    });

    it('should return null if customer not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(null);

      const result = await customerService.getCustomerByPhone('9999999999');

      expect(result).toBeNull();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = 'customer-123';
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
        address: 'New Address'
      };
      const existingCustomer = {
        id: customerId,
        fullName: 'Old Name',
        phone: '0123456789',
        email: 'old@example.com',
        idNumber: '123',
        address: 'Old Address',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedCustomer = {
        ...existingCustomer,
        ...updateData
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(existingCustomer);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findFirst = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.update = jest.fn().mockResolvedValue(updatedCustomer);

      const result = await customerService.updateCustomer(customerId, updateData);

      expect(result).toEqual(updatedCustomer);
      expect(mockPrisma.customer!.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: updateData
      });
    });

    it('should throw error if email already in use by another customer', async () => {
      const customerId = 'customer-123';
      const updateData = { email: 'taken@example.com' };
      const existingCustomer = {
        id: customerId,
        fullName: 'Test Customer',
        phone: '0123456789',
        email: 'old@example.com',
        idNumber: null,
        address: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const otherCustomer = {
        id: 'customer-456',
        fullName: 'Other Customer',
        phone: '0987654321',
        email: 'taken@example.com',
        idNumber: null,
        address: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(existingCustomer);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findFirst = jest.fn().mockResolvedValue(otherCustomer);

      await expect(customerService.updateCustomer(customerId, updateData)).rejects.toThrow(
        ApiError
      );
      await expect(customerService.updateCustomer(customerId, updateData)).rejects.toThrow(
        'Email already in use'
      );
    });

    it('should throw error if customer not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        customerService.updateCustomer('non-existent', { fullName: 'New Name' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      const customerId = 'customer-123';
      const mockCustomer = {
        id: customerId,
        fullName: 'Test Customer',
        phone: '0123456789',
        email: 'test@example.com',
        idNumber: null,
        address: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(mockCustomer);
      // @ts-expect-error - Mock setup
      mockPrisma.booking!.count = jest.fn().mockResolvedValue(0);
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.delete = jest.fn().mockResolvedValue(mockCustomer);

      await customerService.deleteCustomer(customerId);

      expect(mockPrisma.customer!.delete).toHaveBeenCalledWith({
        where: { id: customerId }
      });
    });

    it('should throw error if customer has booking history', async () => {
      const customerId = 'customer-123';
      const mockCustomer = {
        id: customerId,
        fullName: 'Test Customer',
        phone: '0123456789',
        email: 'test@example.com',
        idNumber: null,
        address: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(mockCustomer);
      // @ts-expect-error - Mock setup
      mockPrisma.booking!.count = jest.fn().mockResolvedValue(3);

      await expect(customerService.deleteCustomer(customerId)).rejects.toThrow(ApiError);
      await expect(customerService.deleteCustomer(customerId)).rejects.toThrow(
        'Cannot delete customer with booking history'
      );
      expect(mockPrisma.customer!.delete).not.toHaveBeenCalled();
    });

    it('should throw error if customer not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(customerService.deleteCustomer('non-existent')).rejects.toThrow(ApiError);
    });
  });
});

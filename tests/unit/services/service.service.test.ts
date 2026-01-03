/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach } from '@jest/globals';
import { ServiceService } from '@/services/service.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient } from '@prisma/client';
import ApiError from '@/utils/ApiError';

describe('ServiceService', () => {
  let serviceService: ServiceService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    serviceService = new ServiceService(mockPrisma as PrismaClient);
  });

  describe('createService', () => {
    it('should create a new service successfully', async () => {
      const serviceData = {
        name: 'Laundry Service',
        price: 50000,
        unit: 'kg',
        isActive: true
      };

      const createdService = {
        id: 'service-123',
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.service!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.service!.create as jest.Mock).mockResolvedValue(createdService);

      const result = await serviceService.createService(serviceData);

      expect(result).toEqual(createdService);
      expect(mockPrisma.service!.findFirst).toHaveBeenCalledWith({
        where: { name: serviceData.name }
      });
      expect(mockPrisma.service!.create).toHaveBeenCalledWith({
        data: {
          name: serviceData.name,
          price: serviceData.price,
          unit: serviceData.unit,
          isActive: serviceData.isActive
        }
      });
    });

    it('should throw error if service with same name exists', async () => {
      const serviceData = {
        name: 'Existing Service',
        price: 50000
      };

      const existingService = {
        id: 'existing-123',
        name: 'Existing Service',
        price: 40000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.service!.findFirst as jest.Mock).mockResolvedValue(existingService);

      await expect(serviceService.createService(serviceData)).rejects.toThrow(ApiError);
      await expect(serviceService.createService(serviceData)).rejects.toThrow(
        'Service with this name already exists'
      );
      expect(mockPrisma.service!.create).not.toHaveBeenCalled();
    });

    it('should use default values for optional fields', async () => {
      const serviceData = {
        name: 'Simple Service',
        price: 30000
      };

      (mockPrisma.service!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.service!.create as jest.Mock).mockResolvedValue({
        id: 'service-456',
        ...serviceData,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await serviceService.createService(serviceData);

      expect(mockPrisma.service!.create).toHaveBeenCalledWith({
        data: {
          name: serviceData.name,
          price: serviceData.price,
          unit: 'lần',
          isActive: true
        }
      });
    });
  });

  describe('getAllServices', () => {
    it('should return paginated services', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'Service 1',
          price: 10000,
          unit: 'lần',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { serviceUsages: 5 }
        },
        {
          id: 'service-2',
          name: 'Service 2',
          price: 20000,
          unit: 'kg',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { serviceUsages: 3 }
        }
      ];

      (mockPrisma.service!.findMany as jest.Mock).mockResolvedValue(mockServices);
      (mockPrisma.service!.count as jest.Mock).mockResolvedValue(2);

      const result = await serviceService.getAllServices();

      expect(result).toEqual({
        data: mockServices,
        total: 2,
        page: 1,
        limit: 10
      });
    });

    it('should apply search filter', async () => {
      (mockPrisma.service!.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.service!.count as jest.Mock).mockResolvedValue(0);

      await serviceService.getAllServices({ search: 'laundry' });

      expect(mockPrisma.service!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'laundry', mode: 'insensitive' }
          })
        })
      );
    });

    it('should apply price filters', async () => {
      (mockPrisma.service!.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.service!.count as jest.Mock).mockResolvedValue(0);

      await serviceService.getAllServices({ minPrice: 10000, maxPrice: 50000 });

      expect(mockPrisma.service!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 10000, lte: 50000 }
          })
        })
      );
    });
  });

  describe('getServiceById', () => {
    it('should return service by ID', async () => {
      const mockService = {
        id: 'service-123',
        name: 'Test Service',
        price: 15000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { serviceUsages: 10 }
      };

      (mockPrisma.service!.findUnique as jest.Mock).mockResolvedValue(mockService);

      const result = await serviceService.getServiceById('service-123');

      expect(result).toEqual(mockService);
      expect(mockPrisma.service!.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        include: {
          _count: {
            select: {
              serviceUsages: true
            }
          }
        }
      });
    });

    it('should throw error if service not found', async () => {
      (mockPrisma.service!.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(serviceService.getServiceById('non-existent')).rejects.toThrow(ApiError);
      await expect(serviceService.getServiceById('non-existent')).rejects.toThrow(
        'Service not found'
      );
    });
  });

  describe('updateService', () => {
    it('should update service successfully', async () => {
      const existingService = {
        id: 'service-123',
        name: 'Old Name',
        price: 10000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { serviceUsages: 5 }
      };

      const updateData = {
        name: 'New Name',
        price: 15000
      };

      const updatedService = {
        ...existingService,
        ...updateData
      };

      (mockPrisma.service!.findUnique as jest.Mock).mockResolvedValue(existingService);
      (mockPrisma.service!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.service!.update as jest.Mock).mockResolvedValue(updatedService);

      const result = await serviceService.updateService('service-123', updateData);

      expect(result).toEqual(updatedService);
      expect(mockPrisma.service!.update).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        data: updateData
      });
    });

    it('should throw error if updating to existing name', async () => {
      const existingService = {
        id: 'service-123',
        name: 'Service 1',
        price: 10000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { serviceUsages: 0 }
      };

      const conflictingService = {
        id: 'service-456',
        name: 'Service 2',
        price: 20000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.service!.findUnique as jest.Mock).mockResolvedValue(existingService);
      (mockPrisma.service!.findFirst as jest.Mock).mockResolvedValue(conflictingService);

      await expect(
        serviceService.updateService('service-123', { name: 'Service 2' })
      ).rejects.toThrow('Service with this name already exists');
    });
  });

  describe('deleteService', () => {
    it('should delete service successfully', async () => {
      const mockService = {
        id: 'service-123',
        name: 'Test Service',
        price: 10000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { serviceUsages: 0 }
      };

      (mockPrisma.service!.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockPrisma.serviceUsage!.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.service!.delete as jest.Mock).mockResolvedValue(mockService);

      await serviceService.deleteService('service-123');

      expect(mockPrisma.service!.delete).toHaveBeenCalledWith({
        where: { id: 'service-123' }
      });
    });

    it('should throw error if service has usage records', async () => {
      const mockService = {
        id: 'service-123',
        name: 'Test Service',
        price: 10000,
        unit: 'lần',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { serviceUsages: 5 }
      };

      (mockPrisma.service!.findUnique as jest.Mock).mockResolvedValue(mockService);
      (mockPrisma.serviceUsage!.count as jest.Mock).mockResolvedValue(5);

      await expect(serviceService.deleteService('service-123')).rejects.toThrow(
        'Cannot delete service with existing usage records'
      );
      expect(mockPrisma.service!.delete).not.toHaveBeenCalled();
    });
  });
});

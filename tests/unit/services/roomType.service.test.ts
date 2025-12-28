/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { RoomTypeService } from '../../../src/services/roomType.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';

describe('RoomTypeService', () => {
  let roomTypeService: RoomTypeService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    roomTypeService = new RoomTypeService(mockPrisma as PrismaClient);
    jest.clearAllMocks();
  });

  describe('createRoomType', () => {
    it('should create a new room type successfully', async () => {
      const roomTypeData = {
        name: 'Deluxe Room',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100
      };
      const createdRoomType = {
        id: 'roomtype-123',
        ...roomTypeData,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findFirst = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.create = jest.fn().mockResolvedValue(createdRoomType);

      const result = await roomTypeService.createRoomType(roomTypeData);

      expect(result).toEqual(createdRoomType);
      expect(mockPrisma.roomType!.findFirst).toHaveBeenCalledWith({
        where: { name: roomTypeData.name }
      });
    });

    it('should create room type with tags', async () => {
      const roomTypeData = {
        name: 'Suite',
        capacity: 4,
        totalBed: 2,
        pricePerNight: 200,
        tagIds: ['tag-1', 'tag-2']
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findFirst = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.create = jest.fn().mockResolvedValue({
        id: 'roomtype-456',
        name: roomTypeData.name,
        capacity: roomTypeData.capacity,
        totalBed: roomTypeData.totalBed,
        pricePerNight: roomTypeData.pricePerNight,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      });

      await roomTypeService.createRoomType(roomTypeData);

      expect(mockPrisma.roomType!.create).toHaveBeenCalled();
    });

    it('should throw error if room type name already exists', async () => {
      const roomTypeData = {
        name: 'Deluxe Room',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100
      };
      const existingRoomType = {
        id: 'roomtype-789',
        name: 'Deluxe Room',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findFirst = jest.fn().mockResolvedValue(existingRoomType);

      await expect(roomTypeService.createRoomType(roomTypeData)).rejects.toThrow(ApiError);
      await expect(roomTypeService.createRoomType(roomTypeData)).rejects.toThrow(
        'Room type with this name already exists'
      );
      expect(mockPrisma.roomType!.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllRoomTypes', () => {
    it('should return paginated room types', async () => {
      const mockRoomTypes = [
        {
          id: 'rt-1',
          name: 'Standard',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          roomTypeTags: [],
          _count: { rooms: 10, bookingRooms: 5 }
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue(mockRoomTypes);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.count = jest.fn().mockResolvedValue(1);

      const result = await roomTypeService.getAllRoomTypes();

      expect(result).toEqual({
        data: mockRoomTypes,
        total: 1,
        page: 1,
        limit: 10
      });
    });

    it('should apply search filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.count = jest.fn().mockResolvedValue(0);

      await roomTypeService.getAllRoomTypes({ search: 'deluxe' });

      expect(mockPrisma.roomType!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'deluxe', mode: 'insensitive' }
          })
        })
      );
    });

    it('should apply capacity filters', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.count = jest.fn().mockResolvedValue(0);

      await roomTypeService.getAllRoomTypes({ minCapacity: 2, maxCapacity: 4 });

      expect(mockPrisma.roomType!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            capacity: { gte: 2, lte: 4 }
          })
        })
      );
    });

    it('should apply price filters', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.count = jest.fn().mockResolvedValue(0);

      await roomTypeService.getAllRoomTypes({ minPrice: 50, maxPrice: 150 });

      expect(mockPrisma.roomType!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pricePerNight: { gte: 50, lte: 150 }
          })
        })
      );
    });
  });

  describe('getRoomTypeById', () => {
    it('should return room type by ID', async () => {
      const mockRoomType = {
        id: 'roomtype-123',
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: [],
        _count: { rooms: 5, bookingRooms: 2 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(mockRoomType);

      const result = await roomTypeService.getRoomTypeById('roomtype-123');

      expect(result).toEqual(mockRoomType);
    });

    it('should throw error if room type not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(roomTypeService.getRoomTypeById('non-existent')).rejects.toThrow(ApiError);
      await expect(roomTypeService.getRoomTypeById('non-existent')).rejects.toThrow(
        'Room type not found'
      );
    });
  });

  describe('updateRoomType', () => {
    it('should update room type successfully', async () => {
      const roomTypeId = 'roomtype-123';
      const updateData = {
        name: 'Updated Deluxe',
        pricePerNight: 120
      };
      const existingRoomType = {
        id: roomTypeId,
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: [],
        _count: { rooms: 5, bookingRooms: 2 }
      };
      const updatedRoomType = {
        ...existingRoomType,
        ...updateData,
        roomTypeTags: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(existingRoomType);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findFirst = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.update = jest.fn().mockResolvedValue(updatedRoomType);

      const result = await roomTypeService.updateRoomType(roomTypeId, updateData);

      expect(result).toEqual(updatedRoomType);
    });

    it('should throw error if updating to existing name', async () => {
      const roomTypeId = 'roomtype-123';
      const updateData = { name: 'Suite' };
      const existingRoomType = {
        id: roomTypeId,
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: [],
        _count: { rooms: 5, bookingRooms: 2 }
      };
      const otherRoomType = {
        id: 'roomtype-456',
        name: 'Suite',
        capacity: 4,
        totalBed: 2,
        pricePerNight: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(existingRoomType);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findFirst = jest.fn().mockResolvedValue(otherRoomType);

      await expect(roomTypeService.updateRoomType(roomTypeId, updateData)).rejects.toThrow(
        ApiError
      );
      await expect(roomTypeService.updateRoomType(roomTypeId, updateData)).rejects.toThrow(
        'Room type with this name already exists'
      );
    });
  });

  describe('deleteRoomType', () => {
    it('should delete room type successfully', async () => {
      const roomTypeId = 'roomtype-123';
      const mockRoomType = {
        id: roomTypeId,
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: [],
        _count: { rooms: 0, bookingRooms: 0 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(mockRoomType);
      // @ts-expect-error - Mock setup
      mockPrisma.room = {
        ...mockPrisma.room,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(0)
      } as any;
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.delete = jest.fn().mockResolvedValue(mockRoomType);

      await roomTypeService.deleteRoomType(roomTypeId);

      expect(mockPrisma.roomType!.delete).toHaveBeenCalledWith({
        where: { id: roomTypeId }
      });
    });

    it('should throw error if room type has associated rooms', async () => {
      const roomTypeId = 'roomtype-123';
      const mockRoomType = {
        id: roomTypeId,
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: [],
        _count: { rooms: 5, bookingRooms: 2 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(mockRoomType);
      // @ts-expect-error - Mock setup
      mockPrisma.room = {
        ...mockPrisma.room,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(5)
      } as any;

      await expect(roomTypeService.deleteRoomType(roomTypeId)).rejects.toThrow(ApiError);
      await expect(roomTypeService.deleteRoomType(roomTypeId)).rejects.toThrow(
        'Cannot delete room type with associated rooms'
      );
      expect(mockPrisma.roomType!.delete).not.toHaveBeenCalled();
    });
  });
});

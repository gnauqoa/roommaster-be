/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { RoomService } from '../../../src/services/room.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient, RoomStatus } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';

describe('RoomService', () => {
  let roomService: RoomService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    roomService = new RoomService(mockPrisma as PrismaClient);
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a new room successfully', async () => {
      const roomData = {
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'roomtype-123'
      };
      const mockRoomType = {
        id: 'roomtype-123',
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const createdRoom = {
        id: 'room-123',
        ...roomData,
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: mockRoomType
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(mockRoomType);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.create = jest.fn().mockResolvedValue(createdRoom);

      const result = await roomService.createRoom(roomData);

      expect(result).toEqual(createdRoom);
      expect(mockPrisma.room!.findUnique).toHaveBeenCalledWith({
        where: { roomNumber: roomData.roomNumber }
      });
      expect(mockPrisma.roomType!.findUnique).toHaveBeenCalledWith({
        where: { id: roomData.roomTypeId }
      });
    });

    it('should use default status AVAILABLE if not provided', async () => {
      const roomData = {
        roomNumber: '102',
        floor: 1,
        roomTypeId: 'roomtype-123'
      };
      const mockRoomType = {
        id: 'roomtype-123',
        name: 'Standard',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(mockRoomType);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.create = jest.fn().mockResolvedValue({
        id: 'room-456',
        ...roomData,
        code: '',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: mockRoomType
      });

      await roomService.createRoom(roomData);

      expect(mockPrisma.room!.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RoomStatus.AVAILABLE
          })
        })
      );
    });

    it('should throw error if room number already exists', async () => {
      const roomData = {
        roomNumber: '101',
        floor: 1,
        roomTypeId: 'roomtype-123'
      };
      const existingRoom = {
        id: 'room-789',
        roomNumber: '101',
        floor: 1,
        code: '',
        roomTypeId: 'roomtype-123',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(existingRoom);

      await expect(roomService.createRoom(roomData)).rejects.toThrow(ApiError);
      await expect(roomService.createRoom(roomData)).rejects.toThrow('Room number already exists');
      expect(mockPrisma.room!.create).not.toHaveBeenCalled();
    });

    it('should throw error if room type not found', async () => {
      const roomData = {
        roomNumber: '103',
        floor: 1,
        roomTypeId: 'non-existent'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(roomService.createRoom(roomData)).rejects.toThrow(ApiError);
      await expect(roomService.createRoom(roomData)).rejects.toThrow('Room type not found');
    });
  });

  describe('getAllRooms', () => {
    it('should return paginated rooms', async () => {
      const mockRooms = [
        {
          id: 'room-1',
          roomNumber: '101',
          floor: 1,
          code: 'R101',
          roomTypeId: 'rt-1',
          status: RoomStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
          roomType: {
            id: 'rt-1',
            name: 'Deluxe',
            capacity: 2,
            totalBed: 1,
            pricePerNight: 100,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          _count: { bookingRooms: 5 }
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue(mockRooms);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(1);

      const result = await roomService.getAllRooms();

      expect(result).toEqual({
        data: mockRooms,
        total: 1,
        page: 1,
        limit: 10
      });
    });

    it('should apply search filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(0);

      await roomService.getAllRooms({ search: '101' });

      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roomNumber: { contains: '101', mode: 'insensitive' }
          })
        })
      );
    });

    it('should apply status filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(0);

      await roomService.getAllRooms({ status: RoomStatus.OCCUPIED });

      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RoomStatus.OCCUPIED
          })
        })
      );
    });

    it('should apply floor filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(0);

      await roomService.getAllRooms({ floor: 2 });

      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            floor: 2
          })
        })
      );
    });

    it('should apply room type filter', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(0);

      await roomService.getAllRooms({ roomTypeId: 'roomtype-123' });

      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roomTypeId: 'roomtype-123'
          })
        })
      );
    });
  });

  describe('getRoomById', () => {
    it('should return room by ID', async () => {
      const mockRoom = {
        id: 'room-123',
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: {
          id: 'rt-1',
          name: 'Deluxe',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        _count: { bookingRooms: 3 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(mockRoom);

      const result = await roomService.getRoomById('room-123');

      expect(result).toEqual(mockRoom);
    });

    it('should throw error if room not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(roomService.getRoomById('non-existent')).rejects.toThrow(ApiError);
      await expect(roomService.getRoomById('non-existent')).rejects.toThrow('Room not found');
    });
  });

  describe('updateRoom', () => {
    it('should update room successfully', async () => {
      const roomId = 'room-123';
      const updateData = {
        roomNumber: '102',
        status: RoomStatus.MAINTENANCE
      };
      const existingRoom = {
        id: roomId,
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: {
          id: 'rt-1',
          name: 'Deluxe',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        _count: { bookingRooms: 0 }
      };
      const updatedRoom = {
        ...existingRoom,
        ...updateData
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(existingRoom);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findFirst = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.update = jest.fn().mockResolvedValue(updatedRoom);

      const result = await roomService.updateRoom(roomId, updateData);

      expect(result).toEqual(updatedRoom);
    });

    it('should throw error if updating to existing room number', async () => {
      const roomId = 'room-123';
      const updateData = { roomNumber: '102' };
      const existingRoom = {
        id: roomId,
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: {
          id: 'rt-1',
          name: 'Deluxe',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        _count: { bookingRooms: 0 }
      };
      const otherRoom = {
        id: 'room-456',
        roomNumber: '102',
        floor: 1,
        code: 'R102',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(existingRoom);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findFirst = jest.fn().mockResolvedValue(otherRoom);

      await expect(roomService.updateRoom(roomId, updateData)).rejects.toThrow(ApiError);
      await expect(roomService.updateRoom(roomId, updateData)).rejects.toThrow(
        'Room number already exists'
      );
    });

    it('should throw error if updating to non-existent room type', async () => {
      const roomId = 'room-123';
      const updateData = { roomTypeId: 'non-existent' };
      const existingRoom = {
        id: roomId,
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: {
          id: 'rt-1',
          name: 'Deluxe',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        _count: { bookingRooms: 0 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(existingRoom);
      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(roomService.updateRoom(roomId, updateData)).rejects.toThrow(ApiError);
      await expect(roomService.updateRoom(roomId, updateData)).rejects.toThrow(
        'Room type not found'
      );
    });
  });

  describe('deleteRoom', () => {
    it('should delete room successfully', async () => {
      const roomId = 'room-123';
      const mockRoom = {
        id: roomId,
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: {
          id: 'rt-1',
          name: 'Deluxe',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        _count: { bookingRooms: 0 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(mockRoom);
      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(0)
      } as any;
      // @ts-expect-error - Mock setup
      mockPrisma.room!.delete = jest.fn().mockResolvedValue(mockRoom);

      await roomService.deleteRoom(roomId);

      expect(mockPrisma.room!.delete).toHaveBeenCalledWith({
        where: { id: roomId }
      });
    });

    it('should throw error if room has existing bookings', async () => {
      const roomId = 'room-123';
      const mockRoom = {
        id: roomId,
        roomNumber: '101',
        floor: 1,
        code: 'R101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        roomType: {
          id: 'rt-1',
          name: 'Deluxe',
          capacity: 2,
          totalBed: 1,
          pricePerNight: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        _count: { bookingRooms: 5 }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findUnique = jest.fn().mockResolvedValue(mockRoom);
      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(5)
      } as any;

      await expect(roomService.deleteRoom(roomId)).rejects.toThrow(ApiError);
      await expect(roomService.deleteRoom(roomId)).rejects.toThrow(
        'Cannot delete room with existing bookings'
      );
      expect(mockPrisma.room!.delete).not.toHaveBeenCalled();
    });
  });

  describe('searchAvailableRooms', () => {
    it('should search available rooms with default status', async () => {
      const mockRooms = [
        {
          id: 'room-1',
          roomNumber: '101',
          floor: 1,
          code: 'R101',
          roomTypeId: 'rt-1',
          status: RoomStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
          roomType: {
            id: 'rt-1',
            name: 'Deluxe',
            capacity: 2,
            totalBed: 1,
            pricePerNight: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            roomTypeTags: []
          },
          _count: { bookingRooms: 0 }
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue(mockRooms);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(1);

      const result = await roomService.searchAvailableRooms();

      expect(result.data).toEqual(mockRooms);
      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RoomStatus.AVAILABLE
          })
        })
      );
    });

    it('should apply capacity filters via room type', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(0);

      await roomService.searchAvailableRooms({ minCapacity: 2, maxCapacity: 4 });

      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roomType: expect.objectContaining({
              capacity: { gte: 2, lte: 4 }
            })
          })
        })
      );
    });

    it('should apply price filters via room type', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.count = jest.fn().mockResolvedValue(0);

      await roomService.searchAvailableRooms({ minPrice: 50, maxPrice: 150 });

      expect(mockPrisma.room!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roomType: expect.objectContaining({
              pricePerNight: { gte: 50, lte: 150 }
            })
          })
        })
      );
    });
  });
});

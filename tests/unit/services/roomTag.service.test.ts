/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { RoomTagService } from '@/services/roomTag.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient } from '@prisma/client';
import ApiError from '@/utils/ApiError';

describe('RoomTagService', () => {
  let roomTagService: RoomTagService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    roomTagService = new RoomTagService(mockPrisma as PrismaClient);
    jest.clearAllMocks();
  });

  describe('createRoomTag', () => {
    it('should create a new room tag successfully', async () => {
      const tagData = {
        name: 'WiFi',
        description: 'Free WiFi available'
      };
      const createdTag = {
        id: 'tag-123',
        ...tagData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.create = jest.fn().mockResolvedValue(createdTag);

      const result = await roomTagService.createRoomTag(tagData);

      expect(result).toEqual(createdTag);
      expect(mockPrisma.roomTag!.findUnique).toHaveBeenCalledWith({
        where: { name: tagData.name }
      });
      expect(mockPrisma.roomTag!.create).toHaveBeenCalledWith({
        data: tagData
      });
    });

    it('should create tag without description', async () => {
      const tagData = {
        name: 'Parking'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.create = jest.fn().mockResolvedValue({
        id: 'tag-456',
        ...tagData,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await roomTagService.createRoomTag(tagData);

      expect(mockPrisma.roomTag!.create).toHaveBeenCalled();
    });

    it('should throw error if tag name already exists', async () => {
      const tagData = {
        name: 'WiFi',
        description: 'Free WiFi'
      };
      const existingTag = {
        id: 'tag-789',
        name: 'WiFi',
        description: 'Existing WiFi tag',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(existingTag);

      await expect(roomTagService.createRoomTag(tagData)).rejects.toThrow(ApiError);
      await expect(roomTagService.createRoomTag(tagData)).rejects.toThrow(
        'Room tag with this name already exists'
      );
      expect(mockPrisma.roomTag!.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllRoomTags', () => {
    it('should return all room tags', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'WiFi',
          description: 'Free WiFi',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { roomTypeTags: 5 }
        },
        {
          id: 'tag-2',
          name: 'Parking',
          description: 'Free parking',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { roomTypeTags: 3 }
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findMany = jest.fn().mockResolvedValue(mockTags);

      const result = await roomTagService.getAllRoomTags();

      expect(result).toEqual(mockTags);
      expect(mockPrisma.roomTag!.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              roomTypeTags: true
            }
          }
        }
      });
    });

    it('should return empty array if no tags exist', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findMany = jest.fn().mockResolvedValue([]);

      const result = await roomTagService.getAllRoomTags();

      expect(result).toEqual([]);
    });
  });

  describe('getRoomTagById', () => {
    it('should return room tag by ID', async () => {
      const mockTag = {
        id: 'tag-123',
        name: 'WiFi',
        description: 'Free WiFi',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(mockTag);

      const result = await roomTagService.getRoomTagById('tag-123');

      expect(result).toEqual(mockTag);
      expect(mockPrisma.roomTag!.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag-123' },
        include: {
          roomTypeTags: {
            include: {
              roomType: true
            }
          }
        }
      });
    });

    it('should throw error if tag not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(roomTagService.getRoomTagById('non-existent')).rejects.toThrow(ApiError);
      await expect(roomTagService.getRoomTagById('non-existent')).rejects.toThrow(
        'Room tag not found'
      );
    });
  });

  describe('updateRoomTag', () => {
    it('should update room tag successfully', async () => {
      const tagId = 'tag-123';
      const updateData = {
        name: 'Updated WiFi',
        description: 'Updated description'
      };
      const existingTag = {
        id: tagId,
        name: 'WiFi',
        description: 'Old description',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      };
      const updatedTag = {
        ...existingTag,
        ...updateData
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(existingTag);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findFirst = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.update = jest.fn().mockResolvedValue(updatedTag);

      const result = await roomTagService.updateRoomTag(tagId, updateData);

      expect(result).toEqual(updatedTag);
      expect(mockPrisma.roomTag!.update).toHaveBeenCalledWith({
        where: { id: tagId },
        data: updateData
      });
    });

    it('should throw error if updating to existing name', async () => {
      const tagId = 'tag-123';
      const updateData = { name: 'Parking' };
      const existingTag = {
        id: tagId,
        name: 'WiFi',
        description: 'WiFi tag',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      };
      const otherTag = {
        id: 'tag-456',
        name: 'Parking',
        description: 'Parking tag',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(existingTag);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findFirst = jest.fn().mockResolvedValue(otherTag);

      await expect(roomTagService.updateRoomTag(tagId, updateData)).rejects.toThrow(ApiError);
      await expect(roomTagService.updateRoomTag(tagId, updateData)).rejects.toThrow(
        'Room tag with this name already exists'
      );
    });

    it('should throw error if tag not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        roomTagService.updateRoomTag('non-existent', { name: 'New Name' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteRoomTag', () => {
    it('should delete room tag successfully', async () => {
      const tagId = 'tag-123';
      const mockTag = {
        id: tagId,
        name: 'WiFi',
        description: 'WiFi tag',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(mockTag);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTypeTag = {
        ...mockPrisma.roomTypeTag,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(0)
      } as any;
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.delete = jest.fn().mockResolvedValue(mockTag);

      await roomTagService.deleteRoomTag(tagId);

      expect(mockPrisma.roomTag!.delete).toHaveBeenCalledWith({
        where: { id: tagId }
      });
    });

    it('should throw error if tag is being used', async () => {
      const tagId = 'tag-123';
      const mockTag = {
        id: tagId,
        name: 'WiFi',
        description: 'WiFi tag',
        createdAt: new Date(),
        updatedAt: new Date(),
        roomTypeTags: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(mockTag);
      // @ts-expect-error - Mock setup
      mockPrisma.roomTypeTag = {
        ...mockPrisma.roomTypeTag,
        // @ts-expect-error - Mock setup
        count: jest.fn().mockResolvedValue(3)
      } as any;

      await expect(roomTagService.deleteRoomTag(tagId)).rejects.toThrow(ApiError);
      await expect(roomTagService.deleteRoomTag(tagId)).rejects.toThrow(
        'Cannot delete room tag that is being used by room types'
      );
      expect(mockPrisma.roomTag!.delete).not.toHaveBeenCalled();
    });

    it('should throw error if tag not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.roomTag!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(roomTagService.deleteRoomTag('non-existent')).rejects.toThrow(ApiError);
    });
  });
});

import { PrismaClient, RoomTag } from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';

export interface CreateRoomTagData {
  name: string;
  description?: string;
}

export interface UpdateRoomTagData {
  name?: string;
  description?: string;
}

@Injectable()
export class RoomTagService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new room tag
   * @param {CreateRoomTagData} tagData - Room tag data
   * @returns {Promise<RoomTag>} Created room tag
   */
  async createRoomTag(tagData: CreateRoomTagData): Promise<RoomTag> {
    // Check if tag with same name already exists
    const existingTag = await this.prisma.roomTag.findUnique({
      where: { name: tagData.name }
    });

    if (existingTag) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room tag with this name already exists');
    }

    const tag = await this.prisma.roomTag.create({
      data: tagData
    });

    return tag;
  }

  /**
   * Get all room tags
   * @returns {Promise<RoomTag[]>} All room tags
   */
  async getAllRoomTags(): Promise<RoomTag[]> {
    return this.prisma.roomTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            roomTypeTags: true
          }
        }
      }
    });
  }

  /**
   * Get room tag by ID
   * @param {string} tagId - Room tag ID
   * @returns {Promise<RoomTag>} Room tag
   */
  async getRoomTagById(tagId: string): Promise<RoomTag> {
    const tag = await this.prisma.roomTag.findUnique({
      where: { id: tagId },
      include: {
        roomTypeTags: {
          include: {
            roomType: true
          }
        }
      }
    });

    if (!tag) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room tag not found');
    }

    return tag;
  }

  /**
   * Update room tag by ID
   * @param {string} tagId - Room tag ID
   * @param {UpdateRoomTagData} updateData - Update data
   * @returns {Promise<RoomTag>} Updated room tag
   */
  async updateRoomTag(tagId: string, updateData: UpdateRoomTagData): Promise<RoomTag> {
    await this.getRoomTagById(tagId);

    // Check if updating name to an existing name
    if (updateData.name) {
      const existingTag = await this.prisma.roomTag.findFirst({
        where: {
          name: updateData.name,
          id: { not: tagId }
        }
      });

      if (existingTag) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room tag with this name already exists');
      }
    }

    const updatedTag = await this.prisma.roomTag.update({
      where: { id: tagId },
      data: updateData
    });

    return updatedTag;
  }

  /**
   * Delete room tag by ID
   * @param {string} tagId - Room tag ID
   * @returns {Promise<void>}
   */
  async deleteRoomTag(tagId: string): Promise<void> {
    await this.getRoomTagById(tagId);

    // Check if tag is being used
    const usageCount = await this.prisma.roomTypeTag.count({
      where: { roomTagId: tagId }
    });

    if (usageCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot delete room tag that is being used by room types. Please remove it from room types first.'
      );
    }

    await this.prisma.roomTag.delete({
      where: { id: tagId }
    });
  }
}

export default RoomTagService;

import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { RoomService } from 'services/room.service';
import { sendData } from 'utils/responseWrapper';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class CustomerRoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Search available rooms with filters
   * GET /customer-api/v1/rooms
   */
  searchRooms = catchAsync(async (req: Request, res: Response) => {
    const {
      search,
      floor,
      roomTypeId,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    // Only show available rooms to customers
    const filters = {
      search: search as string,
      status: RoomStatus.AVAILABLE,
      floor: floor ? parseInt(floor as string) : undefined,
      roomTypeId: roomTypeId as string,
      minCapacity: minCapacity ? parseInt(minCapacity as string) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity as string) : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
    };

    const options = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: (sortBy as string) || 'roomNumber',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc'
    };

    const result = await this.roomService.searchAvailableRooms(filters, options);
    sendData(res, result);
  });

  /**
   * Get room details
   * GET /customer-api/v1/rooms/:roomId
   */
  getRoomDetails = catchAsync(async (req: Request, res: Response) => {
    const room = await this.roomService.getRoomById(req.params.roomId);

    // Only show available rooms to customers
    if (room.status !== RoomStatus.AVAILABLE) {
      sendData(res, null, httpStatus.NOT_FOUND);
      return;
    }

    sendData(res, room);
  });
}

export default CustomerRoomController;

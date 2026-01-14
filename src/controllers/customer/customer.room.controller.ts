import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import { RoomService } from '@/services/room.service';
import { sendData } from '@/utils/responseWrapper';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class CustomerRoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Search available rooms with filters (current status only)
   * GET /customer-api/v1/rooms
   * @deprecated Use searchAvailableRoomsByDate for booking - this only checks current room status
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
   * Search rooms available for specific date range
   * GET /customer-api/v1/rooms/available
   * This is the primary endpoint for customers to search rooms before booking
   */
  searchAvailableRoomsByDate = catchAsync(async (req: Request, res: Response) => {
    const {
      checkInDate,
      checkOutDate,
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

    const filters = {
      checkInDate: checkInDate as string,
      checkOutDate: checkOutDate as string,
      search: search as string,
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

    const result = await this.roomService.searchAvailableRoomsByDate(filters, options);
    sendData(res, result);
  });

  /**
   * Check if a specific room is available for a date range
   * GET /customer-api/v1/rooms/:roomId/availability
   */
  checkRoomAvailability = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    const result = await this.roomService.isRoomAvailableForDates(
      roomId,
      new Date(checkInDate as string),
      new Date(checkOutDate as string)
    );

    sendData(res, result);
  });

  /**
   * Bulk check availability for multiple rooms
   * POST /customer-api/v1/rooms/check-availability
   * Useful for validating selected rooms before creating a booking
   */
  checkMultipleRoomsAvailability = catchAsync(async (req: Request, res: Response) => {
    const { roomIds, checkInDate, checkOutDate } = req.body;

    const result = await this.roomService.checkMultipleRoomsAvailability(
      roomIds,
      new Date(checkInDate),
      new Date(checkOutDate)
    );

    sendData(res, result);
  });

  /**
   * Get room details
   * GET /customer-api/v1/rooms/:roomId
   */
  getRoomDetails = catchAsync(async (req: Request, res: Response) => {
    const room = await this.roomService.getCustomerRoomById(req.params.roomId);
    sendData(res, room);
  });
}

export default CustomerRoomController;

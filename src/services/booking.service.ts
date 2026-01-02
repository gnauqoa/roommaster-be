import { PrismaClient, BookingStatus, RoomStatus } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import dayjs from 'dayjs';

export interface RoomRequest {
  roomTypeId: string;
  count: number;
}

export interface CreateBookingPayload {
  rooms: RoomRequest[];
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  customerId: string;
}

export interface CheckInBooking {
  bookingId: string;
  employeeId: string;
}

export interface CheckInPayload {
  checkInInfo: { bookingRoomId: string; customerIds: string[] }[];
  employeeId: string;
}

export interface CheckOutPayload {
  bookingRoomIds: string[];
  employeeId: string;
}

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly transactionService: any,
    private readonly activityService: any
  ) {}

  /**
   * Create a booking with automatic room allocation
   * Allocates available rooms based on room type and count
   */
  async createBooking(input: CreateBookingPayload) {
    const { rooms, checkInDate, checkOutDate, totalGuests, customerId } = input;

    // Calculate number of nights using dayjs
    const checkIn = dayjs(checkInDate);
    const checkOut = dayjs(checkOutDate);
    const nights = checkOut.diff(checkIn, 'day');

    if (nights <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Check-out date must be after check-in date');
    }

    // Validate all room types exist
    const roomTypeIds = rooms.map((r) => r.roomTypeId);
    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        id: { in: roomTypeIds }
      }
    });

    if (roomTypes.length !== roomTypeIds.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'One or more room types not found');
    }

    // Create a map for quick lookup
    const roomTypeMap = new Map(roomTypes.map((rt) => [rt.id, rt]));

    // Find available rooms for each room type
    const allocatedRooms: Array<{
      room: any;
      roomType: any;
    }> = [];

    for (const roomRequest of rooms) {
      const roomType = roomTypeMap.get(roomRequest.roomTypeId);
      if (!roomType) continue;

      // Find available rooms of this type
      const availableRooms = await this.prisma.room.findMany({
        where: {
          roomTypeId: roomRequest.roomTypeId,
          status: RoomStatus.AVAILABLE,
          // Exclude rooms with overlapping bookings
          bookingRooms: {
            none: {
              AND: [
                { checkInDate: { lte: checkOut.toDate() } },
                { checkOutDate: { gte: checkIn.toDate() } },
                {
                  status: {
                    in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                  }
                }
              ]
            }
          }
        },
        take: roomRequest.count,
        include: {
          roomType: true
        }
      });

      if (availableRooms.length < roomRequest.count) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `Not enough available rooms for room type: ${roomType.name}. Requested: ${roomRequest.count}, Available: ${availableRooms.length}`
        );
      }

      allocatedRooms.push(
        ...availableRooms.map((room) => ({
          room,
          roomType: room.roomType
        }))
      );
    }

    // Generate unique booking code
    const bookingCode = `BK${Date.now()}${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Calculate expiration time (15 minutes from now) using dayjs
    const expiresAt = dayjs().add(15, 'minute').toDate();

    // Calculate total amount and deposit required
    let totalAmount = 0;
    let depositRequired = 0;
    const bookingRoomsData = allocatedRooms.map(({ room, roomType }) => {
      const subtotal = Number(roomType.pricePerNight) * nights;
      totalAmount += subtotal;
      depositRequired += Number(roomType.pricePerNight); // One night's price per room

      return {
        roomId: room.id,
        roomTypeId: roomType.id,
        checkInDate: checkIn.toDate(),
        checkOutDate: checkOut.toDate(),
        pricePerNight: roomType.pricePerNight,
        subtotalRoom: subtotal,
        totalAmount: subtotal,
        balance: subtotal,
        status: BookingStatus.PENDING
      };
    });

    // Create booking with transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          status: BookingStatus.PENDING,
          primaryCustomerId: customerId,
          checkInDate: checkIn.toDate(),
          checkOutDate: checkOut.toDate(),
          totalGuests,
          totalAmount,
          depositRequired,
          balance: totalAmount,
          bookingRooms: {
            create: bookingRoomsData
          }
        },
        include: {
          bookingRooms: {
            include: {
              room: true,
              roomType: true
            }
          },
          primaryCustomer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true
            }
          }
        }
      });

      // Update room statuses to RESERVED
      await tx.room.updateMany({
        where: {
          id: { in: allocatedRooms.map((ar) => ar.room.id) }
        },
        data: {
          status: RoomStatus.RESERVED
        }
      });

      return newBooking;
    });

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      expiresAt,
      totalAmount: booking.totalAmount,
      booking
    };
  }

  /**
   * Check in specific booking rooms with customer assignments
   * Updates booking room status to CHECKED_IN, room status to OCCUPIED,
   * and creates BookingCustomer associations
   */
  async checkIn(input: CheckInPayload) {
    const { checkInInfo, employeeId } = input;

    // Extract booking room IDs
    const bookingRoomIds = checkInInfo.map((info) => info.bookingRoomId);

    // Verify all booking rooms exist and are CONFIRMED
    const bookingRooms = await this.prisma.bookingRoom.findMany({
      where: {
        id: { in: bookingRoomIds }
      },
      include: {
        room: true,
        booking: true
      }
    });

    if (bookingRooms.length !== bookingRoomIds.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'One or more booking rooms not found');
    }

    // Validate all booking rooms are CONFIRMED
    const invalidRooms = bookingRooms.filter((br) => br.status !== BookingStatus.CONFIRMED);
    if (invalidRooms.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot check in. All booking rooms must be CONFIRMED. Invalid rooms: ${invalidRooms
          .map((br) => br.room.roomNumber)
          .join(', ')}`
      );
    }

    // Extract all customer IDs and verify they exist
    const allCustomerIds = checkInInfo.flatMap((info) => info.customerIds);
    const uniqueCustomerIds = [...new Set(allCustomerIds)];

    if (uniqueCustomerIds.length > 0) {
      const customers = await this.prisma.customer.findMany({
        where: {
          id: { in: uniqueCustomerIds }
        }
      });

      if (customers.length !== uniqueCustomerIds.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'One or more customers not found');
      }
    }

    const now = dayjs();

    // Perform check-in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update all booking rooms to CHECKED_IN with actual check-in time
      await tx.bookingRoom.updateMany({
        where: {
          id: { in: bookingRoomIds }
        },
        data: {
          status: BookingStatus.CHECKED_IN,
          actualCheckIn: now.toDate()
        }
      });

      // Update all rooms to OCCUPIED
      const roomIds = bookingRooms.map((br) => br.roomId);
      await tx.room.updateMany({
        where: {
          id: { in: roomIds }
        },
        data: {
          status: RoomStatus.OCCUPIED
        }
      });

      // Create BookingCustomer associations for each room
      for (const info of checkInInfo) {
        const bookingRoom = bookingRooms.find((br) => br.id === info.bookingRoomId);
        if (!bookingRoom) continue;

        // Create BookingCustomer records for each customer in this room
        const bookingCustomerPromises = info.customerIds.map((customerId) =>
          tx.bookingCustomer.upsert({
            where: {
              bookingId_customerId: {
                bookingId: bookingRoom.bookingId,
                customerId
              }
            },
            create: {
              bookingId: bookingRoom.bookingId,
              customerId,
              bookingRoomId: info.bookingRoomId,
              isPrimary: false
            },
            update: {
              bookingRoomId: info.bookingRoomId
            }
          })
        );

        await Promise.all(bookingCustomerPromises);
      }

      // Create CHECKED_IN activity for each booking room
      const transactionPromises = bookingRooms.map((br) =>
        this.activityService.createCheckInActivity(br.id, employeeId, br.room.roomNumber, tx)
      );

      await Promise.all(transactionPromises);

      // Check if all booking rooms for each booking are checked in
      const uniqueBookingIds = [...new Set(bookingRooms.map((br) => br.bookingId))];

      for (const bookingId of uniqueBookingIds) {
        const allBookingRooms = await tx.bookingRoom.findMany({
          where: { bookingId }
        });

        const allCheckedIn = allBookingRooms.every(
          (br) => br.status === BookingStatus.CHECKED_IN || bookingRoomIds.includes(br.id)
        );

        // Update booking status to CHECKED_IN if all rooms are checked in
        if (allCheckedIn) {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CHECKED_IN
            }
          });
        }
      }

      // Fetch updated booking rooms with full details
      const updatedBookingRooms = await tx.bookingRoom.findMany({
        where: {
          id: { in: bookingRoomIds }
        },
        include: {
          room: true,
          roomType: true,
          booking: {
            include: {
              primaryCustomer: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                  email: true
                }
              }
            }
          },
          bookingCustomers: {
            include: {
              customer: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return {
        bookingRooms: updatedBookingRooms
      };
    });

    return result;
  }

  /**
   * Check out specific booking rooms
   * Updates booking room status to CHECKED_OUT and room status to AVAILABLE
   */
  async checkOut(input: CheckOutPayload) {
    const { bookingRoomIds, employeeId } = input;

    // Verify all booking rooms exist and are CHECKED_IN
    const bookingRooms = await this.prisma.bookingRoom.findMany({
      where: {
        id: { in: bookingRoomIds }
      },
      include: {
        room: true,
        booking: true
      }
    });

    if (bookingRooms.length !== bookingRoomIds.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'One or more booking rooms not found');
    }

    // Validate all booking rooms are CHECKED_IN
    const invalidRooms = bookingRooms.filter((br) => br.status !== BookingStatus.CHECKED_IN);
    if (invalidRooms.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot check out. All booking rooms must be CHECKED_IN. Invalid rooms: ${invalidRooms
          .map((br) => br.room.roomNumber)
          .join(', ')}`
      );
    }

    const now = dayjs();

    // Perform check-out transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update all booking rooms to CHECKED_OUT with actual check-out time
      await tx.bookingRoom.updateMany({
        where: {
          id: { in: bookingRoomIds }
        },
        data: {
          status: BookingStatus.CHECKED_OUT,
          actualCheckOut: now.toDate()
        }
      });

      // Update all rooms to AVAILABLE
      const roomIds = bookingRooms.map((br) => br.roomId);
      await tx.room.updateMany({
        where: {
          id: { in: roomIds }
        },
        data: {
          status: RoomStatus.AVAILABLE
        }
      });

      // Create CHECKED_OUT activity for each booking room
      const transactionPromises = bookingRooms.map((br) =>
        this.activityService.createCheckOutActivity(br.id, employeeId, br.room.roomNumber, tx)
      );

      await Promise.all(transactionPromises);

      // Check if all booking rooms for each booking are checked out
      const uniqueBookingIds = [...new Set(bookingRooms.map((br) => br.bookingId))];

      for (const bookingId of uniqueBookingIds) {
        const allBookingRooms = await tx.bookingRoom.findMany({
          where: { bookingId }
        });

        const allCheckedOut = allBookingRooms.every(
          (br) => br.status === BookingStatus.CHECKED_OUT || bookingRoomIds.includes(br.id)
        );

        // Update booking status to CHECKED_OUT if all rooms are checked out
        if (allCheckedOut) {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CHECKED_OUT
            }
          });
        }
      }

      // Fetch updated booking rooms with full details
      const updatedBookingRooms = await tx.bookingRoom.findMany({
        where: {
          id: { in: bookingRoomIds }
        },
        include: {
          room: true,
          roomType: true,
          booking: {
            include: {
              primaryCustomer: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return {
        bookingRooms: updatedBookingRooms
      };
    });

    return result;
  }

  /**
   * Get booking by ID with full details
   */
  async getBookingById(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingRooms: {
          include: {
            room: true,
            roomType: true,
            bookingCustomers: {
              include: {
                customer: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        primaryCustomer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    return booking;
  }

  /**
   * Get bookings with pagination and filters
   */
  async getBookings(filter: any, options: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.search) {
      where.OR = [
        { bookingCode: { contains: filter.search, mode: 'insensitive' } },
        { primaryCustomer: { fullName: { contains: filter.search, mode: 'insensitive' } } },
        { primaryCustomer: { phone: { contains: filter.search, mode: 'insensitive' } } }
      ];
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.customerId) {
      where.primaryCustomerId = filter.customerId;
    }

    if (filter.startDate && filter.endDate) {
      where.checkInDate = {
        gte: new Date(filter.startDate),
        lte: new Date(filter.endDate)
      };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          primaryCustomer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true
            }
          },
          bookingRooms: {
            include: {
              roomType: true,
              room: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      this.prisma.booking.count({ where })
    ]);

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string) {
    const booking = await this.getBookingById(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already cancelled');
    }

    if (
      booking.status === BookingStatus.CHECKED_IN ||
      booking.status === BookingStatus.CHECKED_OUT
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel checked-in or checked-out booking');
    }

    // Update booking status and release rooms
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED
        }
      });

      // Update booking rooms status
      await tx.bookingRoom.updateMany({
        where: { bookingId: id },
        data: {
          status: BookingStatus.CANCELLED
        }
      });

      // Release rooms
      const roomIds = booking.bookingRooms.map((br: any) => br.roomId);
      await tx.room.updateMany({
        where: { id: { in: roomIds } },
        data: {
          status: RoomStatus.AVAILABLE
        }
      });
    });

    return { message: 'Booking cancelled successfully' };
  }

  /**
   * Update booking details
   */
  async updateBooking(id: string, updateBody: any) {
    const booking = await this.getBookingById(id);

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.CHECKED_OUT
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update cancelled or checked-out booking');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updateBody,
      include: {
        bookingRooms: true
      }
    });

    return updatedBooking;
  }

  /**
   * Create booking by employee (walk-in/phone)
   */
  async createBookingEmployee(input: any) {
    let customerId = input.customerId;

    // If new customer, create them
    if (!customerId && input.customer) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { phone: input.customer.phone }
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await this.prisma.customer.create({
          data: {
            ...input.customer,
            password: await import('bcryptjs').then((m) => m.hash('12345678', 8)) // Default password
          }
        });
        customerId = newCustomer.id;
      }
    }

    if (!customerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer information is required');
    }

    return this.createBooking({
      ...input,
      customerId
    });
  }
}

export default BookingService;

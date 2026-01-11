import { PrismaClient, BookingStatus, RoomStatus, ActivityType } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import dayjs from 'dayjs';
import AppSettingService from './app-setting.service';
import { encryptPassword } from '@/utils/encryption';
import EmailService from './email.service';

export interface RoomRequest {
  roomId: string;
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
    private readonly activityService: any,
    private readonly appSettingService: AppSettingService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Calculate the correct room status based on current bookings
   * Used after checkout/cancel to determine if room should be AVAILABLE or RESERVED
   * @param roomId - Room ID to check
   * @param tx - Optional Prisma transaction client
   * @returns The appropriate RoomStatus
   */
  private async calculateRoomStatus(roomId: string, tx?: any): Promise<RoomStatus> {
    const prisma = tx || this.prisma;
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

    // Check if there's an active booking for TODAY (should be OCCUPIED or RESERVED)
    const activeBookingToday = await prisma.bookingRoom.findFirst({
      where: {
        roomId,
        checkInDate: { lte: tomorrow },
        checkOutDate: { gt: today },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
        }
      }
    });

    if (activeBookingToday) {
      if (activeBookingToday.status === BookingStatus.CHECKED_IN) {
        return RoomStatus.OCCUPIED;
      }
      // Has a confirmed booking for today but not checked in yet
      return RoomStatus.RESERVED;
    }

    // No active booking for today - room is available
    return RoomStatus.AVAILABLE;
  }

  /**
   * Update room status for multiple rooms based on their current bookings
   * @param roomIds - Array of room IDs to update
   * @param tx - Prisma transaction client
   */
  private async updateRoomStatuses(roomIds: string[], tx: any): Promise<void> {
    for (const roomId of roomIds) {
      const newStatus = await this.calculateRoomStatus(roomId, tx);
      await tx.room.update({
        where: { id: roomId },
        data: { status: newStatus }
      });
    }
  }

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

    // Extract room IDs from requests
    const roomIds = rooms.map((r) => r.roomId);

    // Validate all rooms exist and fetch with their room types
    const selectedRooms = await this.prisma.room.findMany({
      where: {
        id: { in: roomIds }
      },
      include: {
        roomType: true,
        bookingRooms: {
          where: {
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
      }
    });

    // Check if all requested rooms were found
    if (selectedRooms.length !== roomIds.length) {
      const foundIds = selectedRooms.map((r) => r.id);
      const missingIds = roomIds.filter((id) => !foundIds.includes(id));
      throw new ApiError(httpStatus.NOT_FOUND, `Rooms not found: ${missingIds.join(', ')}`);
    }

    // Validate room availability and no overlapping bookings
    for (const room of selectedRooms) {
      // Check if room is permanently unavailable (physical issues only)
      // Note: OCCUPIED, RESERVED, CLEANING are temporary states and don't block future bookings
      if (room.status === RoomStatus.OUT_OF_SERVICE || room.status === RoomStatus.MAINTENANCE) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `Room ${room.roomNumber} cannot be booked (current status: ${room.status})`
        );
      }

      // Check for overlapping bookings - this is the core availability check
      if (room.bookingRooms.length > 0) {
        const conflictingBooking = room.bookingRooms[0];
        throw new ApiError(
          httpStatus.CONFLICT,
          `Room ${room.roomNumber} is already booked from ${dayjs(
            conflictingBooking.checkInDate
          ).format('YYYY-MM-DD')} to ${dayjs(conflictingBooking.checkOutDate).format('YYYY-MM-DD')}`
        );
      }
    }

    // Prepare allocated rooms data
    const allocatedRooms = selectedRooms.map((room) => ({
      room,
      roomType: room.roomType
    }));

    // Generate unique booking code
    const bookingCode = `BK${Date.now()}${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Calculate expiration time (15 minutes from now) using dayjs
    const expiresAt = dayjs().add(15, 'minute').toDate();

    // Get deposit percentage from settings (cached)
    const depositPercentage = await this.appSettingService.getDepositPercentage();

    // Calculate total amount first
    let totalAmount = 0;
    const bookingRoomsData = allocatedRooms.map(({ room, roomType }) => {
      const subtotal = Number(roomType.basePrice) * nights;
      totalAmount += subtotal;

      return {
        roomId: room.id,
        roomTypeId: roomType.id,
        checkInDate: checkIn.toDate(),
        checkOutDate: checkOut.toDate(),
        pricePerNight: roomType.basePrice,
        status: BookingStatus.PENDING
      };
    });

    // Calculate deposit based on percentage of total booking amount
    const depositRequired = Math.round(totalAmount * (depositPercentage / 100));

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

      // NOTE: We no longer update Room.status to RESERVED here.
      // Room.status represents the CURRENT physical state, not future bookings.
      // The overlapping BookingRoom check prevents double-booking.
      // Room.status will be updated to OCCUPIED at check-in time.

      return newBooking;
    });

    // Log booking creation activity
    await this.activityService.createActivity({
      type: ActivityType.CREATE_BOOKING,
      description: `Booking created: ${booking.bookingCode}`,
      customerId: booking.primaryCustomerId,
      metadata: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        totalAmount: booking.totalAmount.toString(),
        totalGuests: booking.totalGuests,
        depositRequired: depositRequired.toString(),
        checkInDate: checkInDate,
        checkOutDate: checkOutDate
      }
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

    // Validate room availability status - rooms must be AVAILABLE or RESERVED to check in
    const unavailableRooms = bookingRooms.filter(
      (br) => br.room.status !== RoomStatus.AVAILABLE && br.room.status !== RoomStatus.RESERVED
    );
    if (unavailableRooms.length > 0) {
      const roomDetails = unavailableRooms
        .map((br) => `${br.room.roomNumber} (${br.room.status})`)
        .join(', ');
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot check in. The following rooms are not ready: ${roomDetails}`
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
    const roomIds = bookingRooms.map((br) => br.roomId);

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

      // check if each room has another booking
      // for today before setting to AVAILABLE (might need to stay RESERVED)
      await this.updateRoomStatuses(roomIds, tx);

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

    const roomIds = booking.bookingRooms.map((br: any) => br.roomId);

    // Update booking status and recalculate room statuses
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

      // Smart room status update: check if each room has other active bookings
      // before setting to AVAILABLE (might need to be RESERVED for another booking)
      await this.updateRoomStatuses(roomIds, tx);
    });

    return { message: 'Booking cancelled successfully' };
  }

  /**
   * Update booking details
   * Validates room availability if dates are changed
   */
  async updateBooking(id: string, updateBody: any) {
    const booking = await this.getBookingById(id);
    const oldStatus = booking.status;

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.CHECKED_OUT
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update cancelled or checked-out booking');
    }

    // Check if dates are being changed
    const datesChanged = updateBody.checkInDate || updateBody.checkOutDate;

    if (datesChanged) {
      // Determine the new date range
      const newCheckIn = updateBody.checkInDate
        ? dayjs(updateBody.checkInDate)
        : dayjs(booking.checkInDate);
      const newCheckOut = updateBody.checkOutDate
        ? dayjs(updateBody.checkOutDate)
        : dayjs(booking.checkOutDate);

      // Validate date range
      if (newCheckOut.isBefore(newCheckIn) || newCheckOut.isSame(newCheckIn)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Check-out date must be after check-in date');
      }

      // Validate room availability for each booking room in the new date range
      for (const bookingRoom of booking.bookingRooms) {
        const conflicts = await this.prisma.bookingRoom.findMany({
          where: {
            AND: [
              { roomId: bookingRoom.roomId },
              { id: { not: bookingRoom.id } }, // Exclude current booking room
              {
                status: {
                  in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                }
              },
              { checkInDate: { lt: newCheckOut.toDate() } },
              { checkOutDate: { gt: newCheckIn.toDate() } }
            ]
          },
          include: {
            room: true
          }
        });

        if (conflicts.length > 0) {
          const conflict = conflicts[0];
          throw new ApiError(
            httpStatus.CONFLICT,
            `Room ${bookingRoom.room.roomNumber} is already booked from ${dayjs(
              conflict.checkInDate
            ).format('YYYY-MM-DD')} to ${dayjs(conflict.checkOutDate).format('YYYY-MM-DD')}`
          );
        }
      }

      // Update BookingRoom dates to match new Booking dates
      await this.prisma.bookingRoom.updateMany({
        where: { bookingId: id },
        data: {
          checkInDate: newCheckIn.toDate(),
          checkOutDate: newCheckOut.toDate()
        }
      });
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updateBody,
      include: {
        bookingRooms: true
      }
    });

    // Trigger booking confirmation email if status changed to CONFIRMED
    if (
      oldStatus !== BookingStatus.CONFIRMED &&
      updatedBooking.status === BookingStatus.CONFIRMED
    ) {
      // Send email asynchronously without blocking the response
      this.emailService.sendBookingConfirmation(updatedBooking.id).catch((error) => {
        console.error('Failed to send booking confirmation email:', error);
      });
    }

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
            password: await encryptPassword('12345678') // Default password
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

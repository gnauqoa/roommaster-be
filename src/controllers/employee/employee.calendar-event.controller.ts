import { Request, Response } from 'express';
import { Injectable } from '@/core/decorators';
import { PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import ApiError from '@/utils/ApiError';

@Injectable()
export class EmployeeCalendarEventController {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * @swagger
   * /employee/calendar-events:
   *   post:
   *     summary: Create a new calendar event
   *     tags: [Employee - Calendar Events]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - startDate
   *               - endDate
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [HOLIDAY, SEASONAL, SPECIAL_EVENT]
   *               startDate:
   *                 type: string
   *                 format: date-time
   *               endDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: Calendar event created successfully
   */
  createEvent = catchAsync(async (req: Request, res: Response) => {
    const event = await this.prisma.calendarEvent.create({
      data: req.body
    });
    res.status(httpStatus.CREATED).json(event);
  });

  /**
   * @swagger
   * /employee/calendar-events:
   *   get:
   *     summary: Get all calendar events
   *     tags: [Employee - Calendar Events]
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [HOLIDAY, SEASONAL, SPECIAL_EVENT]
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: List of calendar events
   */
  getEvents = catchAsync(async (req: Request, res: Response) => {
    const { type, startDate, endDate } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (startDate || endDate) {
      where.AND = [];
      if (startDate) where.AND.push({ endDate: { gte: new Date(startDate as string) } });
      if (endDate) where.AND.push({ startDate: { lte: new Date(endDate as string) } });
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        pricingRules: {
          where: { isActive: true },
          orderBy: { rank: 'asc' }
        }
      }
    });

    res.status(httpStatus.OK).json(events);
  });

  /**
   * @swagger
   * /employee/calendar-events/{id}:
   *   get:
   *     summary: Get a calendar event by ID
   *     tags: [Employee - Calendar Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Calendar event details
   *       404:
   *         description: Calendar event not found
   */
  getEventById = catchAsync(async (req: Request, res: Response) => {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: req.params.id },
      include: {
        pricingRules: {
          where: { isActive: true },
          orderBy: { rank: 'asc' }
        }
      }
    });

    if (!event) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Calendar event not found');
    }

    res.status(httpStatus.OK).json(event);
  });

  /**
   * @swagger
   * /employee/calendar-events/{id}:
   *   put:
   *     summary: Update a calendar event
   *     tags: [Employee - Calendar Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Calendar event updated successfully
   */
  updateEvent = catchAsync(async (req: Request, res: Response) => {
    const event = await this.prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.status(httpStatus.OK).json(event);
  });

  /**
   * @swagger
   * /employee/calendar-events/{id}:
   *   delete:
   *     summary: Delete a calendar event
   *     tags: [Employee - Calendar Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Calendar event deleted successfully
   */
  deleteEvent = catchAsync(async (req: Request, res: Response) => {
    await this.prisma.calendarEvent.delete({
      where: { id: req.params.id }
    });
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export default EmployeeCalendarEventController;

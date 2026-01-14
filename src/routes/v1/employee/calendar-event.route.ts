import express from 'express';
import { authEmployee } from '@/middlewares/auth';
import { container, TOKENS } from '@/core/container';
import EmployeeCalendarEventController from '@/controllers/employee/employee.calendar-event.controller';
import { PrismaClient } from '@prisma/client';

export default function createCalendarEventRoutes(): express.Router {
  const router = express.Router();

  // Manually instantiate controller with dependencies
  const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
  const calendarEventController = new EmployeeCalendarEventController(prisma);

  /**
   * @route   POST /api/v1/employee/calendar-events
   * @desc    Create a new calendar event
   * @access  Private (Employee)
   */
  router.post('/', authEmployee, calendarEventController.createEvent);

  /**
   * @route   GET /api/v1/employee/calendar-events
   * @desc    Get all calendar events (with optional filters)
   * @access  Private (Employee)
   */
  router.get('/', authEmployee, calendarEventController.getEvents);

  /**
   * @route   GET /api/v1/employee/calendar-events/:id
   * @desc    Get a calendar event by ID
   * @access  Private (Employee)
   */
  router.get('/:id', authEmployee, calendarEventController.getEventById);

  /**
   * @route   PUT /api/v1/employee/calendar-events/:id
   * @desc    Update a calendar event
   * @access  Private (Employee)
   */
  router.put('/:id', authEmployee, calendarEventController.updateEvent);

  /**
   * @route   DELETE /api/v1/employee/calendar-events/:id
   * @desc    Delete a calendar event
   * @access  Private (Employee)
   */
  router.delete('/:id', authEmployee, calendarEventController.deleteEvent);

  return router;
}

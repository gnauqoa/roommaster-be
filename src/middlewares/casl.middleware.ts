import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@casl/ability';
import { defineAbilitiesFor } from '@/config/casl-ability';
import ApiError from '@/utils/ApiError';
import httpStatus from 'http-status';
import prisma from '@/prisma';

/**
 * Middleware to attach CASL abilities to request
 * Must be used AFTER authEmployee middleware
 *
 * Usage:
 *   router.use(authEmployee, attachAbilities);
 */
export const attachAbilities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip if no employee or no roleId
    if (!req.employee?.roleId) {
      return next();
    }

    // Build abilities from database and attach to request
    req.ability = await defineAbilitiesFor(req.employee.roleId, prisma);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can access a screen
 * Use this to protect entire route groups by screen
 *
 * Usage:
 *   router.use(authEmployee, attachAbilities, canAccessScreen('Booking'));
 *
 * @param subject - Screen subject (e.g., 'Booking', 'Room', 'Employee')
 */
export const canAccessScreen = (subject: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.ability) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
    }

    if (!req.ability.can('access', subject as any)) {
      return next(new ApiError(httpStatus.FORBIDDEN, `Access denied to ${subject} screen`));
    }

    next();
  };
};

/**
 * Middleware to check if user can perform a specific action
 * Use this to protect individual routes
 *
 * Usage:
 *   router.post('/', authorize('create', 'Booking'), controller.create);
 *   router.delete('/:id', authorize('delete', 'Booking'), controller.delete);
 *
 * @param action - Action to check (e.g., 'create', 'read', 'update', 'delete')
 * @param subject - Subject to check (e.g., 'Booking', 'Room')
 */
export const authorize = (action: string, subject: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.ability) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
    }

    try {
      // Use CASL's ForbiddenError for consistent error handling
      ForbiddenError.from(req.ability).throwUnlessCan(action as any, subject as any);
      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return next(new ApiError(httpStatus.FORBIDDEN, `Cannot ${action} ${subject}`));
      }
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ANY of the required permissions (OR logic)
 * Passes if at least one permission is granted
 *
 * Usage:
 *   router.get('/', authorizeAny([
 *     { action: 'read', subject: 'Booking' },
 *     { action: 'read', subject: 'Room' }
 *   ]), controller.list);
 *
 * @param permissions - Array of permission objects to check
 */
export const authorizeAny = (permissions: Array<{ action: string; subject: string }>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.ability) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
    }

    const ability = req.ability;
    const hasPermission = permissions.some((p) => ability.can(p.action as any, p.subject as any));

    if (!hasPermission) {
      const required = permissions.map((p) => `${p.action}:${p.subject}`).join(' or ');
      return next(new ApiError(httpStatus.FORBIDDEN, `Permission denied. Required: ${required}`));
    }

    next();
  };
};

/**
 * Middleware to check if user has ALL required permissions (AND logic)
 * Passes only if all permissions are granted
 *
 * Usage:
 *   router.post('/transfer', authorizeAll([
 *     { action: 'update', subject: 'Booking' },
 *     { action: 'update', subject: 'Room' }
 *   ]), controller.transfer);
 *
 * @param permissions - Array of permission objects to check
 */
export const authorizeAll = (permissions: Array<{ action: string; subject: string }>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.ability) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
    }

    const ability = req.ability;
    const missingPermissions = permissions.filter(
      (p) => !ability.can(p.action as any, p.subject as any)
    );

    if (missingPermissions.length > 0) {
      const missing = missingPermissions.map((p) => `${p.action}:${p.subject}`).join(', ');
      return next(new ApiError(httpStatus.FORBIDDEN, `Permission denied. Missing: ${missing}`));
    }

    next();
  };
};

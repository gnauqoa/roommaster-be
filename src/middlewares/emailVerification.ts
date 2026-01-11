import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

/**
 * Middleware to check if customer email is verified
 * Must be used after customer auth middleware
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.customer) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  if (!req.customer.isEmailVerified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Please verify your email address to access this resource'
    );
  }

  next();
};

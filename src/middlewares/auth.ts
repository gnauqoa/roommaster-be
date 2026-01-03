import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@/config/env';

const verifyCustomerCallback =
  (req: Request, resolve: any, reject: any) => async (err: any, user: any, info: any) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    // Verify user type from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    try {
      const decoded: any = jwt.verify(token, config.jwt.secret);
      if (decoded.userType !== 'customer') {
        return reject(
          new ApiError(httpStatus.FORBIDDEN, 'Access denied. Customer authentication required')
        );
      }
    } catch (error) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    }

    req.customer = user;
    resolve();
  };

const verifyEmployeeCallback =
  (req: Request, resolve: any, reject: any) => async (err: any, user: any, info: any) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    // Verify user type from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    try {
      const decoded: any = jwt.verify(token, config.jwt.secret);
      if (decoded.userType !== 'employee') {
        return reject(
          new ApiError(httpStatus.FORBIDDEN, 'Access denied. Employee authentication required')
        );
      }
    } catch (error) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    }

    req.employee = user;
    resolve();
  };

/**
 * Customer authentication middleware
 * Verifies JWT token and ensures user is a customer
 * Attaches customer data to req.customer
 */
export const authCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCustomerCallback(req, resolve, reject))(
      req,
      res,
      next
    );
  })
    .then(() => next())
    .catch((err) => next(err));
};

/**
 * Employee authentication middleware
 * Verifies JWT token and ensures user is an employee
 * Attaches employee data to req.employee
 */
export const authEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyEmployeeCallback(req, resolve, reject))(
      req,
      res,
      next
    );
  })
    .then(() => next())
    .catch((err) => next(err));
};

// Default export for backward compatibility (can be removed if not needed)
export default authCustomer;

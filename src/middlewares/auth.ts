import passport from 'passport';
import httpStatus from 'http-status';
import { NextFunction, Request, Response } from 'express';
import { Employee } from '@prisma/client';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';

/**
 * Get employee permissions from database via their UserGroup
 */
const getEmployeePermissions = async (employeeId: number): Promise<string[]> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      userGroup: {
        include: {
          permissions: {
            include: {
              function: true
            }
          }
        }
      }
    }
  });

  if (!employee?.userGroup) {
    return [];
  }

  return employee.userGroup.permissions.map((p) => p.function.functionKey);
};

const verifyCallback =
  (
    req: any,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void,
    requiredRights: string[]
  ) =>
  async (err: unknown, employee: Employee | false, info: unknown) => {
    if (err || info || !employee) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = employee;

    if (requiredRights.length) {
      const employeeRights = await getEmployeePermissions(employee.id);
      const hasRequiredRights = requiredRights.every((requiredRight) =>
        employeeRights.includes(requiredRight)
      );
      if (!hasRequiredRights && req.params.employeeId !== String(employee.id)) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;

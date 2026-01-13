import prisma from '@/prisma';
import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from 'passport-jwt';
import config from './env';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== 'ACCESS') {
      throw new Error('Invalid token type');
    }

    const userType = payload.userType;

    if (userType === 'customer') {
      const customer = await prisma.customer.findUnique({
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          idNumber: true,
          address: true,
          isEmailVerified: true
        },
        where: { id: payload.sub }
      });

      if (!customer) {
        return done(null, false);
      }

      done(null, customer);
    } else if (userType === 'employee') {
      // Include roleId and role name for CASL authorization
      const employee = await prisma.employee.findUnique({
        select: {
          id: true,
          username: true,
          name: true,
          roleId: true,
          roleRef: {
            select: {
              name: true
            }
          }
        },
        where: { id: payload.sub }
      });

      if (!employee) {
        return done(null, false);
      }

      // Flatten role name for easier access
      const employeeWithRole = {
        id: employee.id,
        username: employee.username,
        name: employee.name,
        roleId: employee.roleId,
        roleName: employee.roleRef?.name
      };

      done(null, employeeWithRole);
    } else {
      return done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

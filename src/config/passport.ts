import prisma from '@/prisma';
import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from 'passport-jwt';
import config from './env';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    console.log('123', payload);
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
          address: true
        },
        where: { id: payload.sub }
      });

      if (!customer) {
        return done(null, false);
      }

      done(null, customer);
    } else if (userType === 'employee') {
      const employee = await prisma.employee.findUnique({
        select: {
          id: true,
          username: true,
          name: true,
          role: true
        },
        where: { id: payload.sub }
      });

      if (!employee) {
        return done(null, false);
      }

      done(null, employee);
    } else {
      return done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

import httpStatus from 'http-status';
import tokenService from './token.service';
import employeeService from './employee.service';
import { Employee } from '@prisma/client';
import prisma from 'prisma';
import { encryptPassword, isPasswordMatch } from 'utils/encryption';
import { AuthTokensResponse } from 'types/response';
import exclude from 'utils/exclude';
import ApiError from 'utils/ApiError';

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Omit<Employee, 'passwordHash'>>}
 */
const loginWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<Omit<Employee, 'passwordHash'>> => {
  const employee = await employeeService.getEmployeeByEmail(email);
  if (!employee || !(await isPasswordMatch(password, employee.passwordHash))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  if (!employee.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Account is inactive');
  }
  return exclude(employee, ['passwordHash']);
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenData = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: 'REFRESH',
      blacklisted: false
    }
  });
  if (!refreshTokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(refreshToken, 'REFRESH');
    const { employeeId } = refreshTokenData;
    await prisma.token.delete({ where: { id: refreshTokenData.id } });
    return tokenService.generateAuthTokens({ id: employeeId });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      'RESET_PASSWORD'
    );
    const employee = await employeeService.getEmployeeById(resetPasswordTokenData.employeeId);
    if (!employee) {
      throw new Error();
    }
    const encryptedPassword = await encryptPassword(newPassword);
    await employeeService.updateEmployeeById(employee.id, { passwordHash: encryptedPassword });
    await prisma.token.deleteMany({
      where: { employeeId: employee.id, type: 'RESET_PASSWORD' }
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Change password
 * @param {number} employeeId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const changePassword = async (
  employeeId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const employee = await employeeService.getEmployeeById(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }

  if (!(await isPasswordMatch(currentPassword, employee.passwordHash))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
  }

  const encryptedPassword = await encryptPassword(newPassword);
  await employeeService.updateEmployeeById(employeeId, { passwordHash: encryptedPassword });
};

export default {
  loginWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  changePassword
};

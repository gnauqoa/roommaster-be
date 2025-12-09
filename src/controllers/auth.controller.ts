import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { authService, tokenService, emailService, employeeService } from 'services';
import exclude from 'utils/exclude';
import { Employee } from '@prisma/client';

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const employee = await authService.loginWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(employee);
  res.send({ employee, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  await authService.changePassword(employee.id, req.body.currentPassword, req.body.newPassword);
  res.status(httpStatus.NO_CONTENT).send();
});

const getProfile = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const profile = await employeeService.getEmployeeById(employee.id);
  if (!profile) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Employee not found' });
    return;
  }
  res.send(exclude(profile, ['passwordHash']));
});

const updateProfile = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const updated = await employeeService.updateEmployeeById(employee.id, req.body);
  res.send(exclude(updated, ['passwordHash']));
});

export default {
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
};

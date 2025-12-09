import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { folioService } from 'services';
import { Employee } from '@prisma/client';

// Folio Controllers
const createFolio = catchAsync(async (req, res) => {
  const folio = await folioService.createGuestFolio(req.body);
  res.status(httpStatus.CREATED).send(folio);
});

const getFolios = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['stayRecordId', 'reservationId', 'customerId', 'status']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await folioService.queryGuestFolios(filter, options);
  res.send(result);
});

const getFolio = catchAsync(async (req, res) => {
  const folio = await folioService.getGuestFolioById(Number(req.params.folioId));
  if (!folio) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Folio not found');
  }
  res.send(folio);
});

const getFolioSummary = catchAsync(async (req, res) => {
  const summary = await folioService.getFolioSummary(Number(req.params.folioId));
  res.send(summary);
});

const updateFolio = catchAsync(async (req, res) => {
  const folio = await folioService.updateGuestFolio(Number(req.params.folioId), req.body);
  res.send(folio);
});

const closeFolio = catchAsync(async (req, res) => {
  const folio = await folioService.closeFolio(Number(req.params.folioId));
  res.send(folio);
});

// Transaction Controllers
const addRoomCharge = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.addRoomCharge(
    Number(req.params.folioId),
    employee.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(transaction);
});

const addServiceCharge = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.addServiceCharge(
    Number(req.params.folioId),
    employee.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(transaction);
});

const addPayment = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.addPayment(
    Number(req.params.folioId),
    employee.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(transaction);
});

const addDeposit = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.addDeposit(
    Number(req.params.folioId),
    employee.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(transaction);
});

const addRefund = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.addRefund(
    Number(req.params.folioId),
    employee.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(transaction);
});

const addDiscount = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.addDiscount(
    Number(req.params.folioId),
    employee.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(transaction);
});

const voidTransaction = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const transaction = await folioService.voidTransaction(
    Number(req.params.transactionId),
    employee.id,
    req.body.reason
  );
  res.send(transaction);
});

export default {
  createFolio,
  getFolios,
  getFolio,
  getFolioSummary,
  updateFolio,
  closeFolio,
  addRoomCharge,
  addServiceCharge,
  addPayment,
  addDeposit,
  addRefund,
  addDiscount,
  voidTransaction
};

import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import FolioService from 'services/folio.service';
import { Employee } from '@prisma/client';
import { Injectable } from 'core/decorators';

// Folio Controllers

@Injectable()
export class FolioController {
  constructor(private readonly folioService: FolioService) {}

  createFolio = catchAsync(async (req, res) => {
    const folio = await this.folioService.createGuestFolio(req.body);
    res.status(httpStatus.CREATED).send(folio);
  });

  getFolios = catchAsync(async (req, res) => {
    const filter = pick(req.query, [
      'stayRecordId',
      'stayDetailId',
      'reservationId',
      'customerId',
      'status'
    ]);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.folioService.queryGuestFolios(filter, options);
    res.send(result);
  });

  getFolio = catchAsync(async (req, res) => {
    const folio = await this.folioService.getGuestFolioById(Number(req.params.folioId));
    if (!folio) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Folio not found');
    }
    res.send(folio);
  });

  getFolioSummary = catchAsync(async (req, res) => {
    const summary = await this.folioService.getFolioSummary(Number(req.params.folioId));
    res.send(summary);
  });

  updateFolio = catchAsync(async (req, res) => {
    const folio = await this.folioService.updateGuestFolio(Number(req.params.folioId), req.body);
    res.send(folio);
  });

  closeFolio = catchAsync(async (req, res) => {
    const folio = await this.folioService.closeFolio(Number(req.params.folioId));
    res.send(folio);
  });

  // Transaction Controllers
  addRoomCharge = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.addRoomCharge(
      Number(req.params.folioId),
      employee.id,
      req.body
    );
    res.status(httpStatus.CREATED).send(transaction);
  });

  addServiceCharge = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.addServiceCharge(
      Number(req.params.folioId),
      employee.id,
      req.body
    );
    res.status(httpStatus.CREATED).send(transaction);
  });

  addPayment = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.addPayment(
      Number(req.params.folioId),
      employee.id,
      req.body
    );
    res.status(httpStatus.CREATED).send(transaction);
  });

  addDeposit = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.addDeposit(
      Number(req.params.folioId),
      employee.id,
      req.body
    );
    res.status(httpStatus.CREATED).send(transaction);
  });

  addRefund = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.addRefund(
      Number(req.params.folioId),
      employee.id,
      req.body
    );
    res.status(httpStatus.CREATED).send(transaction);
  });

  addDiscount = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.addDiscount(
      Number(req.params.folioId),
      employee.id,
      req.body
    );
    res.status(httpStatus.CREATED).send(transaction);
  });

  voidTransaction = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const transaction = await this.folioService.voidTransaction(
      Number(req.params.transactionId),
      employee.id,
      req.body.reason
    );
    res.send(transaction);
  });
}

export default FolioController;

import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { invoiceService } from '../services';
import pick from '../utils/pick';

const createInvoice = catchAsync(async (req: Request, res: Response) => {
  const { guestFolioId, invoiceToCustomerId, transactionIds, taxId } = req.body;
  const employeeId = (req.user as { id: number }).id;

  const invoice = await invoiceService.createInvoice(
    guestFolioId,
    invoiceToCustomerId,
    transactionIds,
    employeeId,
    taxId
  );

  res.status(httpStatus.CREATED).send(invoice);
});

const getInvoices = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, [
    'code',
    'guestFolioId',
    'invoiceToCustomerId',
    'employeeId',
    'fromDate',
    'toDate',
    'sortBy',
    'sortType',
    'limit',
    'page'
  ]);

  const result = await invoiceService.queryInvoices(filter);
  res.send(result);
});

const getInvoice = catchAsync(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(Number(req.params.invoiceId));
  res.send(invoice);
});

const getInvoiceForPrint = catchAsync(async (req: Request, res: Response) => {
  const printData = await invoiceService.getInvoiceForPrint(Number(req.params.invoiceId));
  res.send(printData);
});

export default {
  createInvoice,
  getInvoices,
  getInvoice,
  getInvoiceForPrint
};

import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import InvoiceService from '../services/invoice.service';
import pick from '../utils/pick';
import { Injectable } from 'core/decorators';

@Injectable()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  createInvoice = catchAsync(async (req: Request, res: Response) => {
    const { guestFolioId, invoiceToCustomerId, transactionIds, taxId } = req.body;
    const employeeId = (req.user as { id: number }).id;

    const invoice = await this.invoiceService.createInvoice(
      guestFolioId,
      invoiceToCustomerId,
      transactionIds,
      employeeId,
      taxId
    );

    res.status(httpStatus.CREATED).send(invoice);
  });

  getInvoices = catchAsync(async (req: Request, res: Response) => {
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

    const result = await this.invoiceService.queryInvoices(filter);
    res.send(result);
  });

  getInvoice = catchAsync(async (req: Request, res: Response) => {
    const invoice = await this.invoiceService.getInvoiceById(Number(req.params.invoiceId));
    res.send(invoice);
  });

  getInvoiceForPrint = catchAsync(async (req: Request, res: Response) => {
    const printData = await this.invoiceService.getInvoiceForPrint(Number(req.params.invoiceId));
    res.send(printData);
  });
}

export default InvoiceController;

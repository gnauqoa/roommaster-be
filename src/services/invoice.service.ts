import { Prisma, TransactionCategory, TransactionType, PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { Injectable } from 'core/decorators';

/**
 * Generate unique invoice code
 */

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaClient) {}

  async generateInvoiceCode(): Promise<string> {
    const today = new Date();
    const datePrefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(today.getDate()).padStart(2, '0')}`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        code: {
          startsWith: datePrefix
        }
      },
      orderBy: {
        code: 'desc'
      }
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.code.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${datePrefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Create invoice from folio transactions
   */
  createInvoice = async (
    guestFolioId: number,
    invoiceToCustomerId: number,
    transactionIds: number[],
    employeeId: number,
    taxId?: string
  ) => {
    // Validate folio exists and is closed or open
    const folio = await this.prisma.guestFolio.findUnique({
      where: { id: guestFolioId }
    });

    if (!folio) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Folio not found');
    }

    // Get transactions that are DEBIT type (charges)
    const transactions = await this.prisma.folioTransaction.findMany({
      where: {
        id: { in: transactionIds },
        guestFolioId,
        transactionType: TransactionType.DEBIT,
        isVoid: false
      }
    });

    if (transactions.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No valid transactions found for invoice');
    }

    // Check if any transaction is already invoiced
    const alreadyInvoiced = await this.prisma.invoiceDetail.findMany({
      where: {
        transactionId: { in: transactionIds }
      }
    });

    if (alreadyInvoiced.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Some transactions are already invoiced');
    }

    // Calculate total amount
    const totalAmount = transactions.reduce((sum, tx) => sum.add(tx.amount), new Prisma.Decimal(0));

    const code = await this.generateInvoiceCode();

    const invoice = await this.prisma.invoice.create({
      data: {
        code,
        guestFolioId,
        invoiceToCustomerId,
        taxId,
        totalAmount,
        employeeId,
        invoiceDetails: {
          create: transactionIds.map((transactionId) => ({
            transactionId
          }))
        }
      },
      include: {
        guestFolio: true,
        invoiceToCustomer: true,
        employee: {
          select: { id: true, name: true, code: true }
        },
        invoiceDetails: {
          include: {
            transaction: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    return invoice;
  };

  /**
   * Query invoices with filters
   */
  queryInvoices = async (filter: {
    code?: string;
    guestFolioId?: number;
    invoiceToCustomerId?: number;
    employeeId?: number;
    fromDate?: Date;
    toDate?: Date;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }) => {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (filter.code) {
      where.code = { contains: filter.code, mode: 'insensitive' };
    }
    if (filter.guestFolioId) {
      where.guestFolioId = filter.guestFolioId;
    }
    if (filter.invoiceToCustomerId) {
      where.invoiceToCustomerId = filter.invoiceToCustomerId;
    }
    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }
    if (filter.fromDate || filter.toDate) {
      where.invoiceDate = {};
      if (filter.fromDate) {
        where.invoiceDate.gte = filter.fromDate;
      }
      if (filter.toDate) {
        where.invoiceDate.lte = filter.toDate;
      }
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy as keyof Prisma.InvoiceOrderByWithRelationInput] =
        filter.sortType || 'desc';
    } else {
      orderBy.invoiceDate = 'desc';
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          invoiceToCustomer: {
            select: { id: true, fullName: true, code: true }
          },
          employee: {
            select: { id: true, name: true, code: true }
          }
        }
      }),
      this.prisma.invoice.count({ where })
    ]);

    return {
      results: invoices,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    };
  };

  /**
   * Get invoice by ID with full details
   */
  getInvoiceById = async (invoiceId: number) => {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        guestFolio: {
          include: {
            stayRecord: {
              include: {
                stayDetails: {
                  include: { room: true }
                }
              }
            }
          }
        },
        invoiceToCustomer: true,
        employee: {
          select: { id: true, name: true, code: true }
        },
        invoiceDetails: {
          include: {
            transaction: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found');
    }

    // Calculate breakdown by category
    const breakdown = {
      roomCharges: new Prisma.Decimal(0),
      serviceCharges: new Prisma.Decimal(0),
      surcharges: new Prisma.Decimal(0),
      penalties: new Prisma.Decimal(0),
      discounts: new Prisma.Decimal(0)
    };

    invoice.invoiceDetails.forEach((detail) => {
      const tx = detail.transaction;
      switch (tx.category) {
        case TransactionCategory.ROOM_CHARGE:
          breakdown.roomCharges = breakdown.roomCharges.add(tx.amount);
          break;
        case TransactionCategory.SERVICE_CHARGE:
          breakdown.serviceCharges = breakdown.serviceCharges.add(tx.amount);
          break;
        case TransactionCategory.SURCHARGE:
          breakdown.surcharges = breakdown.surcharges.add(tx.amount);
          break;
        case TransactionCategory.PENALTY:
          breakdown.penalties = breakdown.penalties.add(tx.amount);
          break;
        case TransactionCategory.DISCOUNT:
          breakdown.discounts = breakdown.discounts.add(tx.amount);
          break;
      }
    });

    return {
      ...invoice,
      breakdown
    };
  };

  /**
   * Get invoice data for PDF generation
   */
  getInvoiceForPrint = async (invoiceId: number) => {
    const invoice = await this.getInvoiceById(invoiceId);

    // Group transactions by category
    const groupedItems: Record<
      string,
      Array<{
        description: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        amount: Prisma.Decimal;
      }>
    > = {
      'Room Charges': [],
      'Service Charges': [],
      Surcharges: [],
      Penalties: []
    };

    invoice.invoiceDetails.forEach((detail) => {
      const tx = detail.transaction;
      let category = 'Other';

      switch (tx.category) {
        case TransactionCategory.ROOM_CHARGE:
          category = 'Room Charges';
          break;
        case TransactionCategory.SERVICE_CHARGE:
          category = 'Service Charges';
          break;
        case TransactionCategory.SURCHARGE:
          category = 'Surcharges';
          break;
        case TransactionCategory.PENALTY:
          category = 'Penalties';
          break;
      }

      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }

      groupedItems[category].push({
        description: tx.description || tx.service?.name || category,
        quantity: tx.quantity,
        unitPrice: tx.unitPrice || tx.amount,
        amount: tx.amount
      });
    });

    return {
      invoice,
      groupedItems,
      subtotal: invoice.totalAmount,
      taxRate: 0.1, // 10% VAT
      taxAmount: invoice.totalAmount.mul(0.1),
      grandTotal: invoice.totalAmount.mul(1.1)
    };
  };
}

export default InvoiceService;

import {
  Prisma,
  PrismaClient,
  TransactionType,
  TransactionCategory,
  ServiceGroup,
  RoomInspection
} from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { Injectable } from 'core/decorators';

/**
 * Generate unique transaction code
 */

@Injectable()
export class InspectionService {
  constructor(private readonly prisma: PrismaClient) {}

  async generateTransactionCode(): Promise<string> {
    const today = new Date();
    const prefix = 'TX';
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
      today.getDate()
    ).padStart(2, '0')}`;

    const lastTx = await this.prisma.folioTransaction.findFirst({
      where: {
        code: {
          startsWith: prefix + dateStr
        }
      },
      orderBy: {
        code: 'desc'
      }
    });

    let sequence = 1;
    if (lastTx) {
      const lastSequence = parseInt(lastTx.code.slice(-5), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${dateStr}${String(sequence).padStart(5, '0')}`;
  }

  /**
   * Create room inspection before checkout
   */
  async createInspection(
    stayDetailId: number,
    inspectedById: number,
    data: {
      hasDamages?: boolean;
      damageNotes?: string;
      damageAmount?: number;
      hasMissingItems?: boolean;
      missingItems?: string;
      missingAmount?: number;
      hasViolations?: boolean;
      violationNotes?: string;
      penaltyAmount?: number;
      notes?: string;
    }
  ): Promise<RoomInspection> {
    // Check stay detail exists and is occupied
    const stayDetail = await this.prisma.stayDetail.findUnique({
      where: { id: stayDetailId },
      include: {
        stayRecord: {
          include: {
            guestFolios: {
              where: { status: 'OPEN' }
            }
          }
        },
        room: true
      }
    });

    if (!stayDetail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay detail not found');
    }

    // Check if inspection already exists
    const existingInspection = await this.prisma.roomInspection.findUnique({
      where: { stayDetailId }
    });

    if (existingInspection) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room inspection already exists for this stay');
    }

    const damageAmount = new Prisma.Decimal(data.damageAmount || 0);
    const missingAmount = new Prisma.Decimal(data.missingAmount || 0);
    const penaltyAmount = new Prisma.Decimal(data.penaltyAmount || 0);
    const totalPenalty = damageAmount.add(missingAmount).add(penaltyAmount);

    // Create inspection
    const inspection = await this.prisma.roomInspection.create({
      data: {
        stayDetailId,
        inspectedById,
        hasDamages: data.hasDamages || false,
        damageNotes: data.damageNotes,
        damageAmount,
        hasMissingItems: data.hasMissingItems || false,
        missingItems: data.missingItems,
        missingAmount,
        hasViolations: data.hasViolations || false,
        violationNotes: data.violationNotes,
        penaltyAmount,
        totalPenalty,
        notes: data.notes,
        isApproved: !data.hasDamages && !data.hasMissingItems && !data.hasViolations
      },
      include: {
        stayDetail: {
          include: { room: true }
        },
        inspectedBy: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    // If there are penalties, post them to folio
    if (totalPenalty.greaterThan(0)) {
      const folio = stayDetail.stayRecord.guestFolios[0];
      if (folio) {
        // Get penalty services
        const penaltyServices = await this.prisma.service.findMany({
          where: {
            serviceGroup: ServiceGroup.PENALTY
          }
        });

        const defaultPenaltyService = penaltyServices[0];

        // Post damage charges
        if (damageAmount.greaterThan(0)) {
          const txCode = await this.generateTransactionCode();
          await this.prisma.folioTransaction.create({
            data: {
              code: txCode,
              guestFolioId: folio.id,
              stayDetailId,
              serviceId: defaultPenaltyService?.id,
              transactionType: TransactionType.DEBIT,
              category: TransactionCategory.PENALTY,
              amount: damageAmount,
              quantity: 1,
              unitPrice: damageAmount,
              description: `Property Damage - ${
                data.damageNotes || 'Room ' + stayDetail.room.code
              }`,
              employeeId: inspectedById
            }
          });
        }

        // Post missing items charges
        if (missingAmount.greaterThan(0)) {
          const txCode = await this.generateTransactionCode();
          await this.prisma.folioTransaction.create({
            data: {
              code: txCode,
              guestFolioId: folio.id,
              stayDetailId,
              serviceId: defaultPenaltyService?.id,
              transactionType: TransactionType.DEBIT,
              category: TransactionCategory.PENALTY,
              amount: missingAmount,
              quantity: 1,
              unitPrice: missingAmount,
              description: `Missing Items - ${data.missingItems || 'Room ' + stayDetail.room.code}`,
              employeeId: inspectedById
            }
          });
        }

        // Post violation penalties
        if (penaltyAmount.greaterThan(0)) {
          const txCode = await this.generateTransactionCode();
          await this.prisma.folioTransaction.create({
            data: {
              code: txCode,
              guestFolioId: folio.id,
              stayDetailId,
              serviceId: defaultPenaltyService?.id,
              transactionType: TransactionType.DEBIT,
              category: TransactionCategory.PENALTY,
              amount: penaltyAmount,
              quantity: 1,
              unitPrice: penaltyAmount,
              description: `Policy Violation - ${
                data.violationNotes || 'Room ' + stayDetail.room.code
              }`,
              employeeId: inspectedById
            }
          });
        }

        // Update folio totals
        await this.prisma.guestFolio.update({
          where: { id: folio.id },
          data: {
            totalCharges: { increment: totalPenalty },
            balance: { increment: totalPenalty }
          }
        });
      }
    }

    return inspection;
  }

  /**
   * Get inspection by stay detail ID
   */
  async getInspectionByStayDetail(stayDetailId: number) {
    const inspection = await this.prisma.roomInspection.findUnique({
      where: { stayDetailId },
      include: {
        stayDetail: {
          include: {
            room: true,
            stayRecord: {
              include: {
                guestFolios: true
              }
            }
          }
        },
        inspectedBy: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return inspection;
  }

  /**
   * Update inspection
   */
  async updateInspection(
    stayDetailId: number,
    data: {
      isApproved?: boolean;
      notes?: string;
    }
  ): Promise<RoomInspection> {
    const inspection = await this.prisma.roomInspection.update({
      where: { stayDetailId },
      data,
      include: {
        stayDetail: {
          include: { room: true }
        },
        inspectedBy: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return inspection;
  }

  /**
   * Check if room can be checked out (inspection approved or no issues)
   */
  async canCheckout(stayDetailId: number): Promise<boolean> {
    const inspection = await this.prisma.roomInspection.findUnique({
      where: { stayDetailId }
    });

    // No inspection = can checkout
    if (!inspection) {
      return true;
    }

    // Inspection must be approved
    return inspection.isApproved;
  }
}

export default InspectionService;

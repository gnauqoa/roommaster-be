/**
 * Application Module Bootstrap
 * Registers all services and controllers in the DI container
 */

import { container, TOKENS } from './container';
import prisma from 'prisma';

// Services
import { EmailService } from 'services/email.service';
import { EmployeeService } from 'services/employee.service';
import { TokenService } from 'services/token.service';
import AuthService from 'services/auth.service';
import { RoomService } from 'services/room.service';
import CustomerService from 'services/customer.service';
import CustomerTierService from 'services/customer-tier.service';
import ReservationService from 'services/reservation.service';
import StayRecordService from 'services/stay-record.service';
import FolioService from 'services/folio.service';
import ServiceService from 'services/service.service';
import HousekeepingService from 'services/housekeeping.service';
import InvoiceService from 'services/invoice.service';
import InspectionService from 'services/inspection.service';
import NightlyService from 'services/nightly.service';
import ShiftService from 'services/shift.service';
import ReportService from 'services/report.service';

// Controllers
import { AuthController } from 'controllers/auth.controller';
import { EmployeeController } from 'controllers/employee.controller';
import RoomController from 'controllers/room.controller';
import CustomerController from 'controllers/customer.controller';
import CustomerTierController from 'controllers/customer-tier.controller';
import ReservationController from 'controllers/reservation.controller';
import StayRecordController from 'controllers/stay-record.controller';
import FolioController from 'controllers/folio.controller';
import ServiceController from 'controllers/service.controller';
import HousekeepingController from 'controllers/housekeeping.controller';
import InvoiceController from 'controllers/invoice.controller';
import InspectionController from 'controllers/inspection.controller';
import NightlyController from 'controllers/nightly.controller';
import ShiftController from 'controllers/shift.controller';
import ReportController from 'controllers/report.controller';

/**
 * Bootstrap the application by registering all dependencies
 */
export function bootstrap(): void {
  // Register PrismaClient
  container.registerValue(TOKENS.PrismaClient, prisma);

  // Register Services (in order of dependencies)
  container.register({
    token: TOKENS.EmailService,
    useClass: EmailService,
    inject: []
  });

  container.register({
    token: TOKENS.EmployeeService,
    useClass: EmployeeService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.TokenService,
    useClass: TokenService,
    inject: [TOKENS.PrismaClient, TOKENS.EmployeeService]
  });

  container.register({
    token: TOKENS.AuthService,
    useClass: AuthService,
    inject: [TOKENS.PrismaClient, TOKENS.TokenService, TOKENS.EmployeeService]
  });

  container.register({
    token: TOKENS.RoomService,
    useClass: RoomService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.CustomerService,
    useClass: CustomerService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.CustomerTierService,
    useClass: CustomerTierService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.ReservationService,
    useClass: ReservationService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.StayRecordService,
    useClass: StayRecordService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.FolioService,
    useClass: FolioService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.ServiceService,
    useClass: ServiceService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.HousekeepingService,
    useClass: HousekeepingService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.InvoiceService,
    useClass: InvoiceService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.InspectionService,
    useClass: InspectionService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.NightlyService,
    useClass: NightlyService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.ShiftService,
    useClass: ShiftService,
    inject: [TOKENS.PrismaClient]
  });

  container.register({
    token: TOKENS.ReportService,
    useClass: ReportService,
    inject: [TOKENS.PrismaClient]
  });

  // Register Controllers
  container.register({
    token: TOKENS.AuthController,
    useClass: AuthController,
    inject: [TOKENS.AuthService, TOKENS.TokenService, TOKENS.EmailService, TOKENS.EmployeeService]
  });

  container.register({
    token: TOKENS.EmployeeController,
    useClass: EmployeeController,
    inject: [TOKENS.EmployeeService]
  });

  container.register({
    token: TOKENS.RoomController,
    useClass: RoomController,
    inject: [TOKENS.RoomService]
  });

  container.register({
    token: TOKENS.CustomerController,
    useClass: CustomerController,
    inject: [TOKENS.CustomerService]
  });

  container.register({
    token: TOKENS.CustomerTierController,
    useClass: CustomerTierController,
    inject: [TOKENS.CustomerTierService]
  });

  container.register({
    token: TOKENS.ReservationController,
    useClass: ReservationController,
    inject: [TOKENS.ReservationService]
  });

  container.register({
    token: TOKENS.StayRecordController,
    useClass: StayRecordController,
    inject: [TOKENS.StayRecordService]
  });

  container.register({
    token: TOKENS.FolioController,
    useClass: FolioController,
    inject: [TOKENS.FolioService]
  });

  container.register({
    token: TOKENS.ServiceController,
    useClass: ServiceController,
    inject: [TOKENS.ServiceService]
  });

  container.register({
    token: TOKENS.HousekeepingController,
    useClass: HousekeepingController,
    inject: [TOKENS.HousekeepingService]
  });

  container.register({
    token: TOKENS.InvoiceController,
    useClass: InvoiceController,
    inject: [TOKENS.InvoiceService]
  });

  container.register({
    token: TOKENS.InspectionController,
    useClass: InspectionController,
    inject: [TOKENS.InspectionService]
  });

  container.register({
    token: TOKENS.NightlyController,
    useClass: NightlyController,
    inject: [TOKENS.NightlyService]
  });

  container.register({
    token: TOKENS.ShiftController,
    useClass: ShiftController,
    inject: [TOKENS.ShiftService]
  });

  container.register({
    token: TOKENS.ReportController,
    useClass: ReportController,
    inject: [TOKENS.ReportService]
  });
}

/**
 * Get resolved service/controller instances
 */
export const getServices = () => ({
  authService: container.resolve<AuthService>(TOKENS.AuthService),
  tokenService: container.resolve<TokenService>(TOKENS.TokenService),
  emailService: container.resolve<EmailService>(TOKENS.EmailService),
  employeeService: container.resolve<EmployeeService>(TOKENS.EmployeeService),
  roomService: container.resolve<RoomService>(TOKENS.RoomService),
  customerService: container.resolve<CustomerService>(TOKENS.CustomerService),
  customerTierService: container.resolve<CustomerTierService>(TOKENS.CustomerTierService),
  reservationService: container.resolve<ReservationService>(TOKENS.ReservationService),
  stayRecordService: container.resolve<StayRecordService>(TOKENS.StayRecordService),
  folioService: container.resolve<FolioService>(TOKENS.FolioService),
  serviceService: container.resolve<ServiceService>(TOKENS.ServiceService),
  housekeepingService: container.resolve<HousekeepingService>(TOKENS.HousekeepingService),
  invoiceService: container.resolve<InvoiceService>(TOKENS.InvoiceService),
  inspectionService: container.resolve<InspectionService>(TOKENS.InspectionService),
  nightlyService: container.resolve<NightlyService>(TOKENS.NightlyService),
  shiftService: container.resolve<ShiftService>(TOKENS.ShiftService),
  reportService: container.resolve<ReportService>(TOKENS.ReportService)
});

export const getControllers = () => ({
  authController: container.resolve<AuthController>(TOKENS.AuthController),
  employeeController: container.resolve<EmployeeController>(TOKENS.EmployeeController),
  roomController: container.resolve<RoomController>(TOKENS.RoomController),
  customerController: container.resolve<CustomerController>(TOKENS.CustomerController),
  customerTierController: container.resolve<CustomerTierController>(TOKENS.CustomerTierController),
  reservationController: container.resolve<ReservationController>(TOKENS.ReservationController),
  stayRecordController: container.resolve<StayRecordController>(TOKENS.StayRecordController),
  folioController: container.resolve<FolioController>(TOKENS.FolioController),
  serviceController: container.resolve<ServiceController>(TOKENS.ServiceController),
  housekeepingController: container.resolve<HousekeepingController>(TOKENS.HousekeepingController),
  invoiceController: container.resolve<InvoiceController>(TOKENS.InvoiceController),
  inspectionController: container.resolve<InspectionController>(TOKENS.InspectionController),
  nightlyController: container.resolve<NightlyController>(TOKENS.NightlyController),
  shiftController: container.resolve<ShiftController>(TOKENS.ShiftController),
  reportController: container.resolve<ReportController>(TOKENS.ReportController)
});

// Export individual service/controller getters for convenience
export const getAuthService = () => container.resolve<AuthService>(TOKENS.AuthService);
export const getTokenService = () => container.resolve<TokenService>(TOKENS.TokenService);
export const getEmailService = () => container.resolve<EmailService>(TOKENS.EmailService);
export const getEmployeeService = () => container.resolve<EmployeeService>(TOKENS.EmployeeService);
export const getRoomService = () => container.resolve<RoomService>(TOKENS.RoomService);
export const getCustomerService = () => container.resolve<CustomerService>(TOKENS.CustomerService);
export const getCustomerTierService = () =>
  container.resolve<CustomerTierService>(TOKENS.CustomerTierService);
export const getReservationService = () =>
  container.resolve<ReservationService>(TOKENS.ReservationService);
export const getStayRecordService = () =>
  container.resolve<StayRecordService>(TOKENS.StayRecordService);
export const getFolioService = () => container.resolve<FolioService>(TOKENS.FolioService);
export const getServiceService = () => container.resolve<ServiceService>(TOKENS.ServiceService);
export const getHousekeepingService = () =>
  container.resolve<HousekeepingService>(TOKENS.HousekeepingService);
export const getInvoiceService = () => container.resolve<InvoiceService>(TOKENS.InvoiceService);
export const getInspectionService = () =>
  container.resolve<InspectionService>(TOKENS.InspectionService);
export const getNightlyService = () => container.resolve<NightlyService>(TOKENS.NightlyService);
export const getShiftService = () => container.resolve<ShiftService>(TOKENS.ShiftService);
export const getReportService = () => container.resolve<ReportService>(TOKENS.ReportService);

export const getAuthController = () => container.resolve<AuthController>(TOKENS.AuthController);
export const getEmployeeController = () =>
  container.resolve<EmployeeController>(TOKENS.EmployeeController);
export const getRoomController = () => container.resolve<RoomController>(TOKENS.RoomController);
export const getCustomerController = () =>
  container.resolve<CustomerController>(TOKENS.CustomerController);
export const getCustomerTierController = () =>
  container.resolve<CustomerTierController>(TOKENS.CustomerTierController);
export const getReservationController = () =>
  container.resolve<ReservationController>(TOKENS.ReservationController);
export const getStayRecordController = () =>
  container.resolve<StayRecordController>(TOKENS.StayRecordController);
export const getFolioController = () => container.resolve<FolioController>(TOKENS.FolioController);
export const getServiceController = () =>
  container.resolve<ServiceController>(TOKENS.ServiceController);
export const getHousekeepingController = () =>
  container.resolve<HousekeepingController>(TOKENS.HousekeepingController);
export const getInvoiceController = () =>
  container.resolve<InvoiceController>(TOKENS.InvoiceController);
export const getInspectionController = () =>
  container.resolve<InspectionController>(TOKENS.InspectionController);
export const getNightlyController = () =>
  container.resolve<NightlyController>(TOKENS.NightlyController);
export const getShiftController = () => container.resolve<ShiftController>(TOKENS.ShiftController);
export const getReportController = () =>
  container.resolve<ReportController>(TOKENS.ReportController);

export default bootstrap;

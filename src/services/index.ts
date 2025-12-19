// Class exports for DI
export { AuthService } from './auth.service';
export { TokenService } from './token.service';
export { EmailService } from './email.service';
export { EmployeeService } from './employee.service';
export { RoomService } from './room.service';
export { PricingService } from './pricing.service';

// Note: The following services need to be converted to class-based pattern
// For now, they are exported as default objects for backward compatibility
export { default as customerService } from './customer.service';
export { default as reservationService } from './reservation.service';
export { default as stayRecordService } from './stay-record.service';
export { default as folioService } from './folio.service';
export { default as serviceService } from './service.service';
export { default as housekeepingService } from './housekeeping.service';
export { default as invoiceService } from './invoice.service';
export { default as nightlyService } from './nightly.service';
export { default as inspectionService } from './inspection.service';
export { default as customerTierService } from './customer-tier.service';
export { default as shiftService } from './shift.service';
export { default as reportService } from './report.service';

// Re-export getters from bootstrap for convenience
export {
  getAuthService,
  getTokenService,
  getEmailService,
  getEmployeeService,
  getRoomService
} from 'core/bootstrap';

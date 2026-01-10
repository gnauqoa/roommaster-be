export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface BookingConfirmationData {
  bookingCode: string;
  primaryCustomer: {
    fullName: string;
    email: string;
    phone: string;
  };
  checkInDate: Date;
  checkOutDate: Date;
  totalGuests: number;
  bookingRooms: Array<{
    room: {
      roomNumber: string;
      floor: number;
    };
    roomType: {
      name: string;
      capacity: number;
    };
    pricePerNight: number | string;
    checkInDate: Date;
    checkOutDate: Date;
    subtotalRoom: number | string;
    totalAmount: number | string;
  }>;
  totalAmount: number | string;
  depositRequired: number | string;
  totalDeposit: number | string;
  totalPaid: number | string;
  balance: number | string;
}

export interface TemplateData {
  [key: string]: any;
}

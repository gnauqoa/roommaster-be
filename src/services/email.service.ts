import nodemailer, { Transporter } from 'nodemailer';
import dayjs from 'dayjs';
import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import config from '@/config/env';
import TemplateService from './template.service';
import { EmailOptions, BookingConfirmationData } from '@/types/email.types';
import ApiError from '@/utils/ApiError';
import httpStatus from 'http-status';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(
    private readonly templateService: TemplateService,
    private readonly prisma: PrismaClient
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass
      }
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
    }
  }

  /**
   * Send email with generic options
   */
  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send email');
    }
  }

  /**
   * Send booking confirmation email
   */
  public async sendBookingConfirmation(bookingId: string): Promise<void> {
    try {
      // Fetch booking with all related data
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          primaryCustomer: true,
          bookingRooms: {
            include: {
              room: true,
              roomType: true
            }
          }
        }
      });

      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }

      // Check if primary customer has email
      if (!booking.primaryCustomer.email) {
        console.warn(`⚠️  Primary customer has no email for booking ${booking.bookingCode}`);
        return;
      }

      // Calculate total amount from rooms
      const totalAmount = booking.bookingRooms.reduce((sum, br) => {
        const nights = dayjs(br.checkOutDate).diff(dayjs(br.checkInDate), 'day');
        const roomPrice = br.pricePerNight.mul(nights);
        return sum.add(roomPrice);
      }, new Prisma.Decimal(0));

      // Prepare template data
      const templateData: BookingConfirmationData = {
        bookingCode: booking.bookingCode,
        primaryCustomer: {
          fullName: booking.primaryCustomer.fullName,
          email: booking.primaryCustomer.email,
          phone: booking.primaryCustomer.phone
        },
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalGuests: booking.totalGuests,
        bookingRooms: booking.bookingRooms.map((br) => {
          const nights = dayjs(br.checkOutDate).diff(dayjs(br.checkInDate), 'day');
          const subtotalRoom = br.pricePerNight.mul(nights);

          return {
            room: {
              roomNumber: br.room.roomNumber,
              floor: br.room.floor
            },
            roomType: {
              name: br.roomType.name,
              capacity: br.roomType.capacity
            },
            pricePerNight: br.pricePerNight.toString(),
            checkInDate: br.checkInDate,
            checkOutDate: br.checkOutDate,
            subtotalRoom: subtotalRoom.toString(),
            totalAmount: subtotalRoom.toString()
          };
        }),
        totalAmount: totalAmount.toString(),
        depositRequired: totalAmount.toString(), // Single payment means 100% deposit/payment
        isPaid: booking.status === 'CONFIRMED'
      };

      // Render email template
      const html = this.templateService.render('booking-confirmation', templateData);

      // Send email
      await this.sendEmail({
        to: booking.primaryCustomer.email,
        subject: `✅ Xác nhận đặt phòng #${booking.bookingCode} - RoomMaster`,
        html
      });

      console.log(
        `✅ Booking confirmation email sent to ${booking.primaryCustomer.email} for booking ${booking.bookingCode}`
      );
    } catch (error) {
      console.error('❌ Failed to send booking confirmation email:', error);
      // Don't throw error to prevent blocking the booking update
      // Just log it for monitoring
    }
  }

  /**
   * Send test email (useful for testing SMTP configuration)
   */
  public async sendTestEmail(to: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Test Email from RoomMaster',
      html: '<h1>Xin chào!</h1><p>Đây là email test từ RoomMaster.</p>'
    });
  }

  /**
   * Send email verification email
   */
  public async sendVerificationEmail(
    customerEmail: string,
    customerName: string,
    verificationToken: string
  ): Promise<void> {
    try {
      const baseUrl = config.apiUrl.replace(/\/v1\/?$/, '');
      const verificationLink = `${baseUrl}/v1/customer/auth/verify-email?token=${verificationToken}`;

      const templateData = {
        customerName,
        verificationLink
      };

      const html = this.templateService.render('verify-email', templateData);

      await this.sendEmail({
        to: customerEmail,
        subject: '✅ Xác thực email - RoomMaster',
        html
      });

      console.log(`✅ Verification email sent to ${customerEmail}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
    }
  }
}

export default EmailService;

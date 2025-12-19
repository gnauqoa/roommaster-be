import nodemailer, { Transporter } from 'nodemailer';
import config from 'config/env';
import logger from 'config/logger';
import { Injectable } from 'core/decorators';

@Injectable()
export class EmailService {
  private transport: Transporter;

  constructor() {
    this.transport = nodemailer.createTransport(config.email.smtp);
    this.initializeTransport();
  }

  private initializeTransport(): void {
    /* istanbul ignore next */
    if (config.env !== 'test') {
      this.transport
        .verify()
        .then(() => logger.info('Connected to email server'))
        .catch(() =>
          logger.warn(
            'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
          )
        );
    }
  }

  /**
   * Send an email
   * @param {string} to
   * @param {string} subject
   * @param {string} text
   * @returns {Promise<void>}
   */
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const msg = { from: config.email.from, to, subject, text };
    await this.transport.sendMail(msg);
  }

  /**
   * Send reset password email
   * @param {string} to
   * @param {string} token
   * @returns {Promise<void>}
   */
  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    const subject = 'Reset password';
    // replace this url with the link to the reset password page of your front-end app
    const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
    const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
    await this.sendEmail(to, subject, text);
  }

  /**
   * Send verification email
   * @param {string} to
   * @param {string} token
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const subject = 'Email Verification';
    // replace this url with the link to the email verification page of your front-end app
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
    const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}`;
    await this.sendEmail(to, subject, text);
  }

  /**
   * Get the transport instance (for testing)
   */
  getTransport(): Transporter {
    return this.transport;
  }
}

export default EmailService;

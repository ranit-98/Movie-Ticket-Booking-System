import nodemailer from 'nodemailer';
import { logger } from './logger';
import { EmailData } from '../../shared/types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      console.log({
        from: process.env.EMAIL_FROM,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Thank you for registering with our Movie Booking System!</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text: `Please verify your email by clicking this link: ${verificationUrl}`
    });
  }

  async sendBookingSummaryEmail(email: string, bookingData: any[]): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2>Your Booking Summary</h2>
        <p>Here's a summary of all your movie bookings:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Movie</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Theater</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Show Time</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Tickets</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Booking Date</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${bookingData.map(booking => `
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 12px;">${booking.movieName}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px;">${booking.theaterName}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px;">${new Date(booking.showTime).toLocaleString()}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px;">${booking.numberOfTickets}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px;">${new Date(booking.bookingDate).toLocaleDateString()}</td>
                <td style="border: 1px solid #dee2e6; padding: 12px;">${booking.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p>Thank you for using our Movie Booking System!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Movie Booking Summary',
      html,
      text: 'Your booking summary is attached. Please view the HTML version for better formatting.'
    });
  }

  // Additional method for password reset emails (referenced in AuthService)
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password for your Movie Booking System account.</p>
        <p>Please click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
      text: `Please reset your password by clicking this link: ${resetUrl}`
    });
  }
}

export const emailService = new EmailService();
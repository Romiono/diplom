import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  constructor(private configService: ConfigService) {}

  async sendEmail(to: string, subject: string, template: string, data: any) {
    // TODO: Implement email sending with Nodemailer and Bull queue
    console.log('Sending email:', { to, subject, template });
  }

  async sendTransactionCreatedEmail(transaction: any) {
    // TODO: Send email to seller
    console.log('Transaction created email');
  }

  async sendTransactionPaidEmail(transaction: any) {
    // TODO: Send email to seller
    console.log('Transaction paid email');
  }

  async sendDisputeOpenedEmail(transaction: any) {
    // TODO: Send emails to both parties and admins
    console.log('Dispute opened email');
  }
}

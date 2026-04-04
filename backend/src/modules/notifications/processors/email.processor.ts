import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import {
  EmailNotification,
  EmailNotificationStatus,
} from '../entities/email-notification.entity';
import { compileEmail } from '../templates/email-templates';

export const EMAIL_QUEUE = 'email';

export interface EmailJobData {
  notificationId: string;
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(EmailNotification)
    private emailNotificationRepository: Repository<EmailNotification>,
    private configService: ConfigService,
  ) {
    const host = this.configService.get<string>('mail.host');
    const user = this.configService.get<string>('mail.auth.user');
    if (!host || !user) {
      this.logger.warn(
        'Mail transport is not fully configured (MAIL_HOST / MAIL_USER missing). Emails will fail.',
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    this.transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<boolean>('mail.secure'),
      auth: {
        user,
        pass: this.configService.get<string>('mail.auth.pass'),
      },
      tls: {
        rejectUnauthorized: isProduction,
      },
    });
  }

  @Process()
  async handleEmail(job: Job<EmailJobData>): Promise<void> {
    const { notificationId } = job.data;

    const notification = await this.emailNotificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      this.logger.warn(`Email notification ${notificationId} not found`);
      return;
    }

    await this.emailNotificationRepository.increment({ id: notificationId }, 'attempts', 1);
    notification.attempts += 1;

    try {
      const { subject, html } = compileEmail(
        notification.template,
        notification.template_data ?? {},
      );

      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: notification.email,
        subject,
        html,
      });

      notification.status = EmailNotificationStatus.SENT;
      notification.sent_at = new Date();
      notification.error_message = null;
      this.logger.log(`Email sent to ${notification.email} (${notification.template})`);
    } catch (error) {
      notification.status = EmailNotificationStatus.FAILED;
      notification.error_message = error?.message ?? 'Unknown error';
      this.logger.error(
        `Failed to send email ${notificationId}: ${notification.error_message}`,
      );
      throw error;
    } finally {
      await this.emailNotificationRepository.save(notification);
    }
  }
}

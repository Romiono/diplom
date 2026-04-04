import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  EmailNotification,
  EmailNotificationStatus,
} from './entities/email-notification.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { EMAIL_QUEUE } from './processors/email.processor';
import { getTemplateSubject } from './templates/email-templates';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(EmailNotification)
    private emailNotificationRepository: Repository<EmailNotification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectQueue(EMAIL_QUEUE)
    private emailQueue: Queue,
  ) {}

  private sanitizeTemplateData(data: Record<string, any>): Record<string, any> {
    const MAX_STRING_LEN = 500;
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        typeof v === 'string' && v.length > MAX_STRING_LEN
          ? v.slice(0, MAX_STRING_LEN)
          : v,
      ]),
    );
  }

  private async queueEmail(
    userId: string,
    email: string | null | undefined,
    template: string,
    templateData: Record<string, any>,
  ): Promise<void> {
    if (!email) {
      this.logger.debug(`Skipping notification for user ${userId}: no email set`);
      return;
    }

    const safeData = this.sanitizeTemplateData(templateData);

    let subject: string;
    try {
      subject = getTemplateSubject(template, safeData);
    } catch {
      this.logger.error(`Unknown template: ${template}`);
      return;
    }

    const notification = this.emailNotificationRepository.create({
      user_id: userId,
      email,
      subject,
      template,
      template_data: safeData,
      status: EmailNotificationStatus.PENDING,
    });

    const saved = await this.emailNotificationRepository.save(notification);

    try {
      await this.emailQueue.add(
        { notificationId: saved.id },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: { count: 100 },
        },
      );
    } catch (err) {
      this.logger.warn(`Failed to enqueue email ${saved.id}: ${err?.message}`);
    }
  }

  async sendTransactionCreatedEmail(
    transaction: Transaction,
    sellerEmail: string | null | undefined,
  ): Promise<void> {
    await this.queueEmail(
      transaction.seller_id,
      sellerEmail,
      'transaction-created',
      {
        listingTitle: transaction.listing?.title ?? 'listing',
        amount: transaction.amount,
      },
    );
  }

  async sendTransactionPaidEmail(transaction: Transaction): Promise<void> {
    await this.queueEmail(
      transaction.seller_id,
      transaction.seller?.email,
      'transaction-paid',
      {
        listingTitle: transaction.listing?.title ?? 'listing',
        amount: transaction.amount,
      },
    );
  }

  async sendTransactionCompletedEmail(transaction: Transaction): Promise<void> {
    await Promise.all([
      this.queueEmail(
        transaction.buyer_id,
        transaction.buyer?.email,
        'transaction-completed',
        {
          listingTitle: transaction.listing?.title ?? 'listing',
          amount: transaction.amount,
        },
      ),
      this.queueEmail(
        transaction.seller_id,
        transaction.seller?.email,
        'transaction-completed',
        {
          listingTitle: transaction.listing?.title ?? 'listing',
          amount: transaction.amount,
        },
      ),
    ]);
  }

  async sendDisputeOpenedEmail(transaction: Transaction): Promise<void> {
    const templateData = {
      listingTitle: transaction.listing?.title ?? 'listing',
      reason: transaction.dispute_reason ?? '',
      transactionId: transaction.id,
    };

    const parties = [
      this.queueEmail(
        transaction.buyer_id,
        transaction.buyer?.email,
        'transaction-disputed',
        templateData,
      ),
      this.queueEmail(
        transaction.seller_id,
        transaction.seller?.email,
        'transaction-disputed',
        templateData,
      ),
    ];

    const admins = await this.userRepository.find({
      where: { is_admin: true, is_active: true },
      select: ['id', 'email'],
      take: 50,
    });

    const adminNotifications = admins
      .filter((a) => a.email)
      .map((admin) =>
        this.queueEmail(admin.id, admin.email, 'dispute-admin', templateData),
      );

    await Promise.all([...parties, ...adminNotifications]);
  }

  async sendTransactionRefundedEmail(transaction: Transaction): Promise<void> {
    await this.queueEmail(
      transaction.buyer_id,
      transaction.buyer?.email,
      'transaction-refunded',
      {
        listingTitle: transaction.listing?.title ?? 'listing',
        amount: transaction.amount,
      },
    );
  }

  async getUserNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Partial<EmailNotification>>> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.emailNotificationRepository.findAndCount({
      where: { user_id: userId },
      select: ['id', 'subject', 'template', 'status', 'attempts', 'sent_at', 'created_at'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

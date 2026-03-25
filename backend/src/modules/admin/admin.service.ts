import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { AdminAction, AdminActionType } from './entities/admin-action.entity';
import { ResolveDisputeDto, DisputeResolution } from './dto/resolve-dispute.dto';
import { EscrowService } from '../blockchain/services/escrow.service';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(AdminAction)
    private adminActionRepository: Repository<AdminAction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private escrowService: EscrowService,
    private notificationsService: NotificationsService,
  ) {}

  private readonly PUBLIC_USER_FIELDS = [
    'id',
    'wallet_address',
    'username',
    'display_name',
    'avatar_url',
    'rating',
    'total_sales',
    'created_at',
  ];

  async getDisputes(): Promise<Transaction[]> {
    return this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.buyer', 'buyer')
      .addSelect(this.PUBLIC_USER_FIELDS.map((f) => `buyer.${f}`))
      .leftJoin('tx.seller', 'seller')
      .addSelect(this.PUBLIC_USER_FIELDS.map((f) => `seller.${f}`))
      .leftJoinAndSelect('tx.listing', 'listing')
      .where('tx.status = :status', { status: TransactionStatus.DISPUTED })
      .orderBy('tx.dispute_opened_at', 'DESC')
      .getMany();
  }

  async resolveDispute(
    transactionId: string,
    adminId: string,
    resolveDisputeDto: ResolveDisputeDto,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['buyer', 'seller', 'listing'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.DISPUTED) {
      throw new BadRequestException('Transaction is not in disputed status');
    }

    if (!transaction.escrow_contract_address) {
      throw new BadRequestException(
        'Transaction has no escrow contract address and cannot be resolved on-chain',
      );
    }

    const { resolution, comment } = resolveDisputeDto;

    transaction.status =
      resolution === DisputeResolution.REFUND_BUYER
        ? TransactionStatus.REFUNDED
        : TransactionStatus.COMPLETED;
    transaction.dispute_resolved_by = adminId;
    transaction.dispute_resolution = comment;
    transaction.dispute_resolved_at = new Date();

    await this.transactionRepository.save(transaction);

    if (resolution === DisputeResolution.REFUND_BUYER) {
      await this.escrowService.refund(transaction.escrow_contract_address);
    } else {
      await this.escrowService.release(transaction.escrow_contract_address);
    }

    if (resolution === DisputeResolution.REFUND_BUYER) {
      this.notificationsService
        .sendTransactionRefundedEmail(transaction)
        .catch(() => {});
    } else {
      this.notificationsService
        .sendTransactionCompletedEmail(transaction)
        .catch(() => {});
    }

    await this.logAdminAction(
      adminId,
      AdminActionType.RESOLVE_DISPUTE,
      'transaction',
      transactionId,
      { resolution, comment },
    );
  }

  async banUser(adminId: string, userId: string, reason: string): Promise<void> {
    if (adminId === userId) {
      throw new ForbiddenException('Cannot ban yourself');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_admin) {
      throw new ForbiddenException('Cannot ban another admin');
    }

    user.is_active = false;
    await this.userRepository.save(user);

    await this.logAdminAction(
      adminId,
      AdminActionType.BAN_USER,
      'user',
      userId,
      { reason },
    );
  }

  async unbanUser(adminId: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_active) {
      throw new BadRequestException('User is not banned');
    }

    user.is_active = true;
    await this.userRepository.save(user);

    await this.logAdminAction(
      adminId,
      AdminActionType.UNBAN_USER,
      'user',
      userId,
      {},
    );
  }

  private async logAdminAction(
    adminId: string,
    actionType: AdminActionType,
    targetType: string,
    targetId: string,
    details: any,
  ): Promise<void> {
    const action = this.adminActionRepository.create({
      admin_id: adminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
    });

    await this.adminActionRepository.save(action);
  }
}

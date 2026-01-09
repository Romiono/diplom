import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { AdminAction, AdminActionType } from './entities/admin-action.entity';
import { ResolveDisputeDto, DisputeResolution } from './dto/resolve-dispute.dto';
import { EscrowService } from '../blockchain/services/escrow.service';
import { User } from '../users/entities/user.entity';

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
  ) {}

  async getDisputes(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { status: TransactionStatus.DISPUTED },
      relations: ['buyer', 'seller', 'listing'],
      order: { dispute_opened_at: 'DESC' },
    });
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
      throw new NotFoundException('Transaction is not in disputed status');
    }

    const { resolution, comment } = resolveDisputeDto;

    // Execute resolution via smart contract
    if (resolution === DisputeResolution.REFUND_BUYER) {
      await this.escrowService.refund(transaction.escrow_contract_address);
      transaction.status = TransactionStatus.REFUNDED;
    } else {
      await this.escrowService.release(transaction.escrow_contract_address);
      transaction.status = TransactionStatus.COMPLETED;
    }

    transaction.dispute_resolved_by = adminId;
    transaction.dispute_resolution = comment;
    transaction.dispute_resolved_at = new Date();

    await this.transactionRepository.save(transaction);

    // Log admin action
    await this.logAdminAction(
      adminId,
      AdminActionType.RESOLVE_DISPUTE,
      'transaction',
      transactionId,
      { resolution, comment },
    );
  }

  async banUser(adminId: string, userId: string, reason: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
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

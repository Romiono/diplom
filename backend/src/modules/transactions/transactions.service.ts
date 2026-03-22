import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { TransactionHistory } from './entities/transaction-history.entity';
import { Listing, ListingStatus } from '../listings/entities/listing.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { EscrowService } from '../blockchain/services/escrow.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

const PUBLIC_USER_FIELDS = [
  'id',
  'wallet_address',
  'username',
  'display_name',
  'avatar_url',
  'rating',
  'total_sales',
  'created_at',
] as const;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionHistory)
    private historyRepository: Repository<TransactionHistory>,
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
    private escrowService: EscrowService,
    private listingsService: ListingsService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    buyerId: string,
    buyerWalletAddress: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { listing_id } = createTransactionDto;

    const listing = await this.listingRepository.findOne({
      where: { id: listing_id },
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not available for purchase');
    }

    if (listing.seller_id === buyerId) {
      throw new BadRequestException('Cannot buy your own listing');
    }

    const reserved = await this.listingsService.reserveListing(listing_id);
    if (!reserved) {
      throw new BadRequestException('Listing is no longer available');
    }

    let escrowAddress: string;
    try {
      escrowAddress = await this.escrowService.deployEscrow({
        sellerAddress: listing.seller.wallet_address,
        buyerAddress: buyerWalletAddress,
        amount: Number(listing.price),
        timeoutSeconds: 30 * 24 * 60 * 60,
      });
    } catch (err) {
      await this.listingsService.unreserveListing(listing_id);
      throw err;
    }

    const transaction = this.transactionRepository.create({
      listing_id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount: listing.price,
      escrow_contract_address: escrowAddress,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.logHistory(
      savedTransaction.id,
      null,
      null,
      TransactionStatus.PENDING,
      'Transaction created',
    );

    this.notificationsService
      .sendTransactionCreatedEmail(savedTransaction, listing.seller?.email)
      .catch(() => {});

    return savedTransaction;
  }

  async findOne(id: string, requestingUserId?: string): Promise<Transaction> {
    const transaction = await this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.buyer', 'buyer')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `buyer.${f}`))
      .leftJoin('tx.seller', 'seller')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `seller.${f}`))
      .leftJoinAndSelect('tx.listing', 'listing')
      .where('tx.id = :id', { id })
      .getOne();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      requestingUserId !== undefined &&
      transaction.buyer_id !== requestingUserId &&
      transaction.seller_id !== requestingUserId
    ) {
      throw new ForbiddenException(
        'You do not have access to this transaction',
      );
    }

    return transaction;
  }

  private async loadTransactionWithRelations(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['buyer', 'seller', 'listing'],
    });
  }

  async getUserTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Transaction>> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.buyer', 'buyer')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `buyer.${f}`))
      .leftJoin('tx.seller', 'seller')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `seller.${f}`))
      .leftJoinAndSelect('tx.listing', 'listing')
      .where('tx.buyer_id = :userId OR tx.seller_id = :userId', { userId })
      .orderBy('tx.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async confirmReceipt(transactionId: string, buyerId: string): Promise<void> {
    const transaction = await this.loadTransactionWithRelations(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyer_id !== buyerId) {
      throw new ForbiddenException('Only buyer can confirm receipt');
    }

    if (transaction.status !== TransactionStatus.PAID) {
      throw new BadRequestException('Transaction is not in paid status');
    }

    try {
      await this.escrowService.release(transaction.escrow_contract_address);
    } catch (err) {
      throw new BadRequestException(
        `Failed to release escrow funds: ${err?.message ?? 'blockchain error'}`,
      );
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completed_at = new Date();
    await this.transactionRepository.save(transaction);

    await this.listingsService.markAsSold(transaction.listing_id);

    await this.usersService.incrementSalesCount(transaction.seller_id);
    await this.usersService.incrementPurchasesCount(transaction.buyer_id);

    await this.logHistory(
      transactionId,
      buyerId,
      TransactionStatus.PAID,
      TransactionStatus.COMPLETED,
      'Buyer confirmed receipt',
    );

    this.notificationsService
      .sendTransactionCompletedEmail(transaction)
      .catch(() => {});
  }

  async openDispute(
    transactionId: string,
    userId: string,
    openDisputeDto: OpenDisputeDto,
  ): Promise<void> {
    const transaction = await this.loadTransactionWithRelations(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      transaction.buyer_id !== userId &&
      transaction.seller_id !== userId
    ) {
      throw new ForbiddenException('You are not part of this transaction');
    }

    if (transaction.status !== TransactionStatus.PAID) {
      throw new BadRequestException('Cannot open dispute for this transaction');
    }

    const oldStatus = transaction.status;

    transaction.status = TransactionStatus.DISPUTED;
    transaction.dispute_reason = openDisputeDto.reason;
    transaction.dispute_opened_at = new Date();
    await this.transactionRepository.save(transaction);

    await this.listingsService.markAsDisputed(transaction.listing_id);

    await this.logHistory(
      transactionId,
      userId,
      oldStatus,
      TransactionStatus.DISPUTED,
      `Dispute opened: ${openDisputeDto.reason}`,
    );

    this.notificationsService
      .sendDisputeOpenedEmail(transaction)
      .catch(() => {});
  }

  async updatePaymentStatus(
    transactionId: string,
    dto: UpdatePaymentDto,
  ): Promise<void> {
    const transaction = await this.loadTransactionWithRelations(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot mark as paid: transaction is already in '${transaction.status}' status`,
      );
    }

    transaction.status = TransactionStatus.PAID;
    transaction.tx_hash = dto.txHash;
    transaction.block_number = dto.blockNumber;
    transaction.paid_at = new Date();

    await this.transactionRepository.save(transaction);

    await this.logHistory(
      transactionId,
      null,
      TransactionStatus.PENDING,
      TransactionStatus.PAID,
      'Payment received',
    );

    this.notificationsService
      .sendTransactionPaidEmail(transaction)
      .catch(() => {});
  }

  private async logHistory(
    transactionId: string,
    changedBy: string,
    oldStatus: TransactionStatus,
    newStatus: TransactionStatus,
    comment: string,
  ): Promise<void> {
    const history = this.historyRepository.create({
      transaction_id: transactionId,
      changed_by: changedBy,
      old_status: oldStatus,
      new_status: newStatus,
      comment,
    });

    await this.historyRepository.save(history);
  }
}

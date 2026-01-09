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
import { EscrowService } from '../blockchain/services/escrow.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';

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
  ) {}

  async create(
    buyerId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { listing_id } = createTransactionDto;

    // Get listing
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

    // Reserve listing
    await this.listingsService.reserveListing(listing_id);

    // Deploy escrow contract
    const escrowAddress = await this.escrowService.deployEscrow({
      sellerAddress: listing.seller.wallet_address,
      buyerAddress: buyerId, // In production, get buyer wallet address
      amount: Number(listing.price),
      timeoutSeconds: 30 * 24 * 60 * 60, // 30 days
    });

    // Create transaction
    const transaction = this.transactionRepository.create({
      listing_id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount: listing.price,
      escrow_contract_address: escrowAddress,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Log history
    await this.logHistory(savedTransaction.id, null, null, TransactionStatus.PENDING, 'Transaction created');

    return savedTransaction;
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['buyer', 'seller', 'listing'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: [{ buyer_id: userId }, { seller_id: userId }],
      relations: ['listing', 'buyer', 'seller'],
      order: { created_at: 'DESC' },
    });
  }

  async confirmReceipt(transactionId: string, buyerId: string): Promise<void> {
    const transaction = await this.findOne(transactionId);

    if (transaction.buyer_id !== buyerId) {
      throw new ForbiddenException('Only buyer can confirm receipt');
    }

    if (transaction.status !== TransactionStatus.PAID) {
      throw new BadRequestException('Transaction is not in paid status');
    }

    // Release funds to seller via smart contract
    await this.escrowService.release(transaction.escrow_contract_address);

    // Update transaction status
    transaction.status = TransactionStatus.COMPLETED;
    transaction.completed_at = new Date();
    await this.transactionRepository.save(transaction);

    // Mark listing as sold
    await this.listingsService.markAsSold(transaction.listing_id);

    // Update user stats
    await this.usersService.incrementSalesCount(transaction.seller_id);
    await this.usersService.incrementPurchasesCount(transaction.buyer_id);

    // Log history
    await this.logHistory(
      transactionId,
      buyerId,
      TransactionStatus.PAID,
      TransactionStatus.COMPLETED,
      'Buyer confirmed receipt',
    );
  }

  async openDispute(
    transactionId: string,
    userId: string,
    openDisputeDto: OpenDisputeDto,
  ): Promise<void> {
    const transaction = await this.findOne(transactionId);

    if (
      transaction.buyer_id !== userId &&
      transaction.seller_id !== userId
    ) {
      throw new ForbiddenException('You are not part of this transaction');
    }

    if (
      transaction.status !== TransactionStatus.PAID &&
      transaction.status !== TransactionStatus.CONFIRMED
    ) {
      throw new BadRequestException('Cannot open dispute for this transaction');
    }

    const oldStatus = transaction.status;

    // Update transaction
    transaction.status = TransactionStatus.DISPUTED;
    transaction.dispute_reason = openDisputeDto.reason;
    transaction.dispute_opened_at = new Date();
    await this.transactionRepository.save(transaction);

    // Mark listing as disputed
    await this.listingsService.markAsDisputed(transaction.listing_id);

    // Log history
    await this.logHistory(
      transactionId,
      userId,
      oldStatus,
      TransactionStatus.DISPUTED,
      `Dispute opened: ${openDisputeDto.reason}`,
    );
  }

  async updatePaymentStatus(
    transactionId: string,
    txHash: string,
    blockNumber: number,
  ): Promise<void> {
    const transaction = await this.findOne(transactionId);

    transaction.status = TransactionStatus.PAID;
    transaction.tx_hash = txHash;
    transaction.block_number = blockNumber;
    transaction.paid_at = new Date();

    await this.transactionRepository.save(transaction);

    await this.logHistory(
      transactionId,
      null,
      TransactionStatus.PENDING,
      TransactionStatus.PAID,
      'Payment received',
    );
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

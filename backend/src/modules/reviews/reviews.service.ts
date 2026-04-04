import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UsersService } from '../users/users.service';

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
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private usersService: UsersService,
  ) {}

  async create(
    reviewerId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { transaction_id, rating, comment } = createReviewDto;

    const transaction = await this.transactionRepository.findOne({
      where: { id: transaction_id },
      relations: ['buyer', 'seller'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new ForbiddenException('Cannot review incomplete transaction');
    }

    let revieweeId: string;
    if (transaction.buyer_id === reviewerId) {
      revieweeId = transaction.seller_id;
    } else if (transaction.seller_id === reviewerId) {
      revieweeId = transaction.buyer_id;
    } else {
      throw new ForbiddenException('You are not part of this transaction');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { transaction_id, reviewer_id: reviewerId },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this transaction');
    }

    const review = this.reviewRepository.create({
      transaction_id,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    await this.usersService.updateRating(revieweeId);

    return savedReview;
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.reviewer', 'reviewer')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `reviewer.${f}`))
      .where('review.reviewee_id = :userId', { userId })
      .orderBy('review.created_at', 'DESC')
      .getMany();
  }

  async getTransactionReviews(
    transactionId: string,
    requesterId: string,
  ): Promise<Review[]> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      transaction.buyer_id !== requesterId &&
      transaction.seller_id !== requesterId
    ) {
      throw new ForbiddenException(
        'You are not part of this transaction',
      );
    }

    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.reviewer', 'reviewer')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `reviewer.${f}`))
      .leftJoin('review.reviewee', 'reviewee')
      .addSelect(PUBLIC_USER_FIELDS.map((f) => `reviewee.${f}`))
      .where('review.transaction_id = :transactionId', { transactionId })
      .getMany();
  }
}

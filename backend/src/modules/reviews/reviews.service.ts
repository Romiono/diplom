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

    // Check if transaction exists and is completed
    const transaction = await this.transactionRepository.findOne({
      where: { id: transaction_id },
      relations: ['buyer', 'seller'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new ForbiddenException(
        'Cannot review incomplete transaction',
      );
    }

    // Determine reviewee
    let revieweeId: string;
    if (transaction.buyer_id === reviewerId) {
      revieweeId = transaction.seller_id;
    } else if (transaction.seller_id === reviewerId) {
      revieweeId = transaction.buyer_id;
    } else {
      throw new ForbiddenException('You are not part of this transaction');
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findOne({
      where: {
        transaction_id,
        reviewer_id: reviewerId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this transaction');
    }

    // Create review
    const review = this.reviewRepository.create({
      transaction_id,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update user rating
    await this.usersService.updateRating(revieweeId);

    return savedReview;
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { reviewee_id: userId },
      relations: ['reviewer', 'transaction'],
      order: { created_at: 'DESC' },
    });
  }

  async getTransactionReviews(transactionId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { transaction_id: transactionId },
      relations: ['reviewer', 'reviewee'],
    });
  }
}

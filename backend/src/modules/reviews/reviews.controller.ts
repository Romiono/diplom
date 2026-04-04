import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.create(user.sub, createReviewDto);
  }

  @Public()
  @Get('user/:userId')
  async getUserReviews(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtAuthGuard)
  async getTransactionReviews(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.getTransactionReviews(transactionId, user.sub);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.create(
      user.sub,
      user.walletAddress,
      createTransactionDto,
    );
  }

  @Get()
  async getUserTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.transactionsService.getUserTransactions(
      user.sub,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transactionsService.findOne(id, user.sub);
  }

  @Post(':id/confirm')
  async confirmReceipt(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.transactionsService.confirmReceipt(id, user.sub);
    return { message: 'Transaction confirmed successfully' };
  }

  @Post(':id/dispute')
  async openDispute(
    @Param('id') id: string,
    @Body() openDisputeDto: OpenDisputeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.transactionsService.openDispute(id, user.sub, openDisputeDto);
    return { message: 'Dispute opened successfully' };
  }

  @Post(':id/payment')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    
    const transaction = await this.transactionsService.findOne(id, user.sub);
    if (transaction.buyer_id !== user.sub) {
      throw new ForbiddenException('Only the buyer can register payment');
    }
    await this.transactionsService.updatePaymentStatus(id, updatePaymentDto);
    return { message: 'Payment status updated successfully' };
  }
}

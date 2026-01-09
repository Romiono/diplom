import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.create(user.sub, createTransactionDto);
  }

  @Get()
  async getUserTransactions(@CurrentUser() user: JwtPayload) {
    return this.transactionsService.getUserTransactions(user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
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
}

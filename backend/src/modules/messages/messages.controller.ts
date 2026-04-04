import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /messages/chats — list all conversations (grouped by listing) for the current user
   */
  @Get('chats')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async getMyChats(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getUserChats(user.sub);
  }

  /**
   * GET /messages/history/:listingId — message history for a specific listing chat
   * Only buyer or seller of that listing may access it.
   */
  @Get('history/:listingId')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async getListingHistory(
    @CurrentUser() user: JwtPayload,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    return this.messagesService.getListingHistory(listingId, user.sub, safePage, safeLimit);
  }
}

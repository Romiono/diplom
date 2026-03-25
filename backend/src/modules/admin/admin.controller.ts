import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('disputes')
  async getDisputes() {
    return this.adminService.getDisputes();
  }

  @Post('disputes/:id/resolve')
  async resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminService.resolveDispute(id, user.sub, resolveDisputeDto);
    return { message: 'Dispute resolved successfully' };
  }

  @Post('users/:id/ban')
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() banUserDto: BanUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminService.banUser(user.sub, id, banUserDto.reason);
    return { message: 'User banned successfully' };
  }

  @Post('users/:id/unban')
  async unbanUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminService.unbanUser(user.sub, id);
    return { message: 'User unbanned successfully' };
  }
}

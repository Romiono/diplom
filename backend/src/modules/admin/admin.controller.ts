import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
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
    @Param('id') id: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminService.resolveDispute(id, user.sub, resolveDisputeDto);
    return { message: 'Dispute resolved successfully' };
  }

  @Post('users/:id/ban')
  async banUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminService.banUser(user.sub, id, reason);
    return { message: 'User banned successfully' };
  }
}

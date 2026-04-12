import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @Public()
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload | null,
  ) {
    if (user && (user.sub === id || user.isAdmin)) {
      return this.usersService.getOwnProfile(id);
    }
    return this.usersService.getProfile(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.sub !== id && !user.isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  async getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return {
      rating: user.rating,
      totalSales: user.total_sales,
      totalPurchases: user.total_purchases,
    };
  }
}

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TonAuthDto } from './dto/ton-auth.dto';
import { Public } from '../../common/decorators/public.decorator';

@Throttle({ default: { limit: 5, ttl: 900000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('ton-connect')
  async tonConnect(@Body() tonAuthDto: TonAuthDto) {
    return this.authService.authenticateWithTon(tonAuthDto);
  }

  @Public()
  @Get('nonce')
  async getNonce(@Query('walletAddress') walletAddress: string) {
    const nonce = await this.authService.generateNonce(walletAddress);
    return { nonce };
  }
}

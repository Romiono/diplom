import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TonAuthDto } from './dto/ton-auth.dto';
import { Public } from '../../common/decorators/public.decorator';

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

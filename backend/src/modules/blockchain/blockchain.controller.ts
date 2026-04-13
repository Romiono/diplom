import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsNumber, IsPositive } from 'class-validator';
import { TonClientService } from './services/ton-client.service';
import { EscrowService } from './services/escrow.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

class DeployEscrowDto {
  @IsString()
  sellerAddress: string;

  @IsString()
  buyerAddress: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNumber()
  @IsPositive()
  timeoutSeconds: number;
}

@Controller('blockchain')
@UseGuards(JwtAuthGuard)
export class BlockchainController {
  constructor(
    private readonly tonClientService: TonClientService,
    private readonly escrowService: EscrowService,
  ) {}

  
  @Public()
  @Get('health')
  async healthCheck() {
    try {
      const client = await this.tonClientService.getClient();
      return {
        status: 'ok',
        network: process.env.TON_NETWORK || 'testnet',
        connected: !!client,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  
  @Public()
  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    try {
      const balance = await this.tonClientService.getBalance(address);
      return {
        address,
        balance: balance.toString(),
        balanceTON: (Number(balance) / 1e9).toFixed(2),
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to get balance',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  
  @Public()
  @Get('validate/:address')
  async validateAddress(@Param('address') address: string) {
    const isValid = await this.tonClientService.isValidAddress(address);
    return {
      address,
      isValid,
    };
  }

  
  @Post('escrow/deploy')
  @UseGuards(AdminGuard)
  async deployEscrow(@Body() dto: DeployEscrowDto) {
    try {
      const contractAddress = await this.escrowService.deployEscrow({
        sellerAddress: dto.sellerAddress,
        buyerAddress: dto.buyerAddress,
        amount: dto.amount,
        timeoutSeconds: dto.timeoutSeconds,
      });

      return {
        success: true,
        contractAddress,
        status: 'created',
        deployedAt: new Date().toISOString(),
        seller: dto.sellerAddress,
        buyer: dto.buyerAddress,
        amount: dto.amount,
        timeout: new Date(
          Date.now() + dto.timeoutSeconds * 1000,
        ).toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to deploy escrow contract',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  @Public()
  @Get('escrow/:address')
  async getEscrowState(@Param('address') address: string) {
    try {
      const state = await this.escrowService.getContractState(address);
      return state;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to get contract state',
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  
  @Post('escrow/:address/fund')
  @UseGuards(AdminGuard)
  async fundEscrow(@Param('address') address: string) {
    try {
      await this.escrowService.fund(address);
      return {
        success: true,
        message: 'Fund transaction sent',
        contractAddress: address,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fund escrow',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  @Post('escrow/:address/release')
  @UseGuards(AdminGuard)
  async releaseEscrow(@Param('address') address: string) {
    try {
      await this.escrowService.release(address);
      return {
        success: true,
        message: 'Release transaction sent',
        contractAddress: address,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to release funds',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  @Post('escrow/:address/refund')
  @UseGuards(AdminGuard)
  async refundEscrow(@Param('address') address: string) {
    try {
      await this.escrowService.refund(address);
      return {
        success: true,
        message: 'Refund transaction sent',
        contractAddress: address,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to refund',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  @Public()
  @Get('transactions/:address')
  async getTransactions(
    @Param('address') address: string,
    @Param('limit') limit: number = 10,
  ) {
    try {
      const transactions =
        await this.tonClientService.getTransactions(address, limit);
      return {
        address,
        count: transactions.length,
        transactions,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to get transactions',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  @Public()
  @Get('contract/:address/deployed')
  async isContractDeployed(@Param('address') address: string) {
    try {
      const isDeployed =
        await this.tonClientService.isContractDeployed(address);
      return {
        address,
        isDeployed,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to check contract deployment',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

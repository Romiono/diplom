import { Module } from '@nestjs/common';
import { TonClientService } from './services/ton-client.service';
import { EscrowService } from './services/escrow.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  controllers: [BlockchainController],
  providers: [TonClientService, EscrowService],
  exports: [TonClientService, EscrowService],
})
export class BlockchainModule {}

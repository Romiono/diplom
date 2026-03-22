import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TonClientService } from './ton-client.service';
import { Address, toNano, Cell, internal } from '@ton/core';
import { WalletContractV4 } from '@ton/ton';
import { Escrow, EscrowStatus } from '../../../../contracts/wrappers/Escrow';
import * as fs from 'fs';
import * as path from 'path';
import { mnemonicToPrivateKey } from '@ton/crypto';

export interface EscrowDeployParams {
  sellerAddress: string;
  buyerAddress: string;
  amount: number;
  timeoutSeconds: number;
}

@Injectable()
export class EscrowService implements OnModuleInit {
  private compiledCode: Cell | null = null;
  private adminWallet: WalletContractV4 | null = null;
  private adminKeyPair: { publicKey: Buffer; secretKey: Buffer } | null = null;

  constructor(
    private configService: ConfigService,
    private tonClientService: TonClientService,
  ) {}

  async onModuleInit() {
    try {
      await this.loadCompiledContract();

      const mnemonic = this.configService.get<string>('ton.adminWalletMnemonic');
      if (mnemonic && mnemonic.length > 0) {
        await this.initializeAdminWallet(mnemonic);
      }
    } catch (error) {
      console.error('Failed to initialize EscrowService:', error);
    }
  }

  private async loadCompiledContract(): Promise<void> {
    const compiledPath = path.join(
      process.cwd(),
      'contracts/build/escrow.compiled.json',
    );

    if (fs.existsSync(compiledPath)) {
      const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf-8'));
      this.compiledCode = Cell.fromBoc(Buffer.from(compiled.base64, 'base64'))[0];
      console.log('Escrow contract code loaded successfully');
    } else {
      console.warn('Compiled contract not found. Contract deployment will fail.');
      console.warn('Run: npm run compile:contract');
    }
  }

  private async initializeAdminWallet(mnemonic: string): Promise<void> {
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    this.adminKeyPair = keyPair;

    this.adminWallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });

    console.log('Admin wallet initialized:', this.adminWallet.address);
  }

  async deployEscrow(params: EscrowDeployParams): Promise<string> {
    const { sellerAddress, buyerAddress, amount, timeoutSeconds } = params;

    if (!this.compiledCode) {
      throw new Error(
        'Contract code not loaded. Run: npm run contract:compile',
      );
    }

    if (!this.adminWallet) {
      throw new Error(
        'Admin wallet not initialized. Set TON_ADMIN_WALLET_MNEMONIC in .env',
      );
    }

    try {
      const seller = Address.parse(sellerAddress);
      const buyer = Address.parse(buyerAddress);
      const timeout = Math.floor(Date.now() / 1000) + timeoutSeconds;

      const escrow = Escrow.createFromConfig(
        {
          sellerAddress: seller,
          buyerAddress: buyer,
          amount: BigInt(Math.floor(amount * 1e9)),
          timeout,
          adminAddress: this.adminWallet.address,
        },
        this.compiledCode,
      );

      const client = await this.tonClientService.getClient();
      const contract = client.open(escrow);

      console.log('Deploying escrow contract:', {
        address: escrow.address.toString(),
        seller: sellerAddress,
        buyer: buyerAddress,
        amount,
        timeout: new Date(timeout * 1000),
      });

      const adminBalance = await this.tonClientService.getBalance(
        this.adminWallet.address.toString(),
      );
      const deployFee = toNano('0.05');

      if (adminBalance < deployFee) {
        throw new Error(
          `Insufficient admin wallet balance. Required: ${deployFee}, Available: ${adminBalance}`,
        );
      }

      const openedWallet = client.open(this.adminWallet);
      const sender = openedWallet.sender(this.adminKeyPair.secretKey);
      await contract.sendDeploy(sender, deployFee);

      console.log('Escrow deployed successfully:', escrow.address.toString());

      await this.waitForDeployment(escrow.address.toString(), 30000);

      return escrow.address.toString();
    } catch (error) {
      console.error('Failed to deploy escrow:', error);
      throw error;
    }
  }

  async fund(contractAddress: string): Promise<void> {
    if (!this.adminWallet) {
      throw new Error('Admin wallet not initialized');
    }

    try {
      const address = Address.parse(contractAddress);
      const client = await this.tonClientService.getClient();
      const escrow = client.open(new Escrow(address));

      console.log('Funding escrow contract:', contractAddress);

      const status = await escrow.getStatus();
      if (status !== EscrowStatus.CREATED) {
        throw new Error(
          `Cannot fund: contract is not in CREATED status (current: ${status})`,
        );
      }

      const data = await escrow.getContractData();
      const fundAmount = data.amount + toNano('0.05');

      const openedWallet = client.open(this.adminWallet);
      const sender = openedWallet.sender(this.adminKeyPair.secretKey);
      await escrow.sendFund(sender, fundAmount);

      console.log('Fund transaction sent successfully');
    } catch (error) {
      console.error('Failed to fund escrow:', error);
      throw error;
    }
  }

  async release(contractAddress: string): Promise<void> {
    if (!this.adminWallet) {
      throw new Error('Admin wallet not initialized');
    }

    try {
      const address = Address.parse(contractAddress);
      const client = await this.tonClientService.getClient();
      const escrow = client.open(new Escrow(address));

      console.log('Releasing funds from escrow:', contractAddress);

      const status = await escrow.getStatus();
      if (status !== EscrowStatus.FUNDED) {
        throw new Error(
          `Cannot release: contract is not in FUNDED status (current: ${status})`,
        );
      }

      const openedWallet = client.open(this.adminWallet);
      const sender = openedWallet.sender(this.adminKeyPair.secretKey);
      await escrow.sendRelease(sender);

      console.log('Release transaction sent successfully');
    } catch (error) {
      console.error('Failed to release funds:', error);
      throw error;
    }
  }

  async refund(contractAddress: string): Promise<void> {
    if (!this.adminWallet) {
      throw new Error('Admin wallet not initialized');
    }

    try {
      const address = Address.parse(contractAddress);
      const client = await this.tonClientService.getClient();
      const escrow = client.open(new Escrow(address));

      console.log('Refunding funds to buyer:', contractAddress);

      const status = await escrow.getStatus();
      if (status !== EscrowStatus.FUNDED) {
        throw new Error(
          `Cannot refund: contract is not in FUNDED status (current: ${status})`,
        );
      }

      const openedWallet = client.open(this.adminWallet);
      const sender = openedWallet.sender(this.adminKeyPair.secretKey);
      await escrow.sendRefund(sender);

      console.log('Refund transaction sent successfully');
    } catch (error) {
      console.error('Failed to refund:', error);
      throw error;
    }
  }

  async getContractState(contractAddress: string): Promise<any> {
    try {
      const address = Address.parse(contractAddress);
      const client = await this.tonClientService.getClient();
      const escrow = client.open(new Escrow(address));

      const data = await escrow.getContractData();

      return {
        address: contractAddress,
        seller: data.seller.toString(),
        buyer: data.buyer.toString(),
        amount: Number(data.amount) / 1e9,
        timeout: new Date(data.timeout * 1000),
        status: this.getStatusName(data.status),
        admin: data.admin.toString(),
        isDeployed: true,
      };
    } catch (error) {
      console.error('Failed to get contract state:', error);
      throw new Error(
        `Contract not found or not deployed: ${contractAddress}`,
      );
    }
  }

  /**
   * Ждем подтверждения деплоя контракта
   */
  private async waitForDeployment(
    contractAddress: string,
    timeout: number = 30000,
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < timeout) {
      try {
        const state = await this.getContractState(contractAddress);
        if (state.isDeployed) {
          console.log('Contract deployed and confirmed');
          return;
        }
      } catch (error) {
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Contract deployment timeout');
  }

  private getStatusName(status: number): string {
    switch (status) {
      case EscrowStatus.CREATED:
        return 'created';
      case EscrowStatus.FUNDED:
        return 'funded';
      case EscrowStatus.RELEASED:
        return 'released';
      case EscrowStatus.REFUNDED:
        return 'refunded';
      default:
        return 'unknown';
    }
  }
}

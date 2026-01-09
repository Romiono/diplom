import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TonClient, Address } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

@Injectable()
export class TonClientService {
  private client: TonClient;
  private isTestnet: boolean;

  constructor(private configService: ConfigService) {
    this.isTestnet =
      this.configService.get<string>('ton.network') === 'testnet';
  }

  async getClient(): Promise<TonClient> {
    if (!this.client) {
      const endpoint = await getHttpEndpoint({
        network: this.isTestnet ? 'testnet' : 'mainnet',
      });

      this.client = new TonClient({ endpoint });
      console.log(
        `TON client initialized for ${this.isTestnet ? 'testnet' : 'mainnet'}`,
      );
    }

    return this.client;
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      const client = await this.getClient();
      const parsedAddress = Address.parse(address);
      const balance = await client.getBalance(parsedAddress);
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error(`Failed to get balance for address: ${address}`);
    }
  }

  async isValidAddress(address: string): Promise<boolean> {
    try {
      Address.parse(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверяет, задеплоен ли контракт по адресу
   */
  async isContractDeployed(address: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const parsedAddress = Address.parse(address);
      const state = await client.getContractState(parsedAddress);
      return state.state === 'active';
    } catch (error) {
      return false;
    }
  }

  /**
   * Получает информацию о последних транзакциях
   */
  async getTransactions(
    address: string,
    limit: number = 10,
  ): Promise<any[]> {
    try {
      const client = await this.getClient();
      const parsedAddress = Address.parse(address);
      const transactions = await client.getTransactions(parsedAddress, {
        limit,
      });
      return transactions;
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }
}

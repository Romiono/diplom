import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  toNano,
} from '@ton/core';

export type EscrowConfig = {
  sellerAddress: Address;
  buyerAddress: Address;
  amount: bigint;
  timeout: number;
  adminAddress: Address;
};

export enum EscrowStatus {
  CREATED = 0,
  FUNDED = 1,
  RELEASED = 2,
  REFUNDED = 3,
}

export class Escrow implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromConfig(config: EscrowConfig, code: Cell, workchain = 0) {
    const data = beginCell()
      .storeAddress(config.sellerAddress)
      .storeAddress(config.buyerAddress)
      .storeCoins(config.amount)
      .storeUint(config.timeout, 32)
      .storeUint(EscrowStatus.CREATED, 8)
      .storeAddress(config.adminAddress)
      .endCell();

    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new Escrow(address, init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendFund(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(1, 32).endCell(),
    });
  }

  // OP 2: Release funds to seller
  async sendRelease(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano('0.05'), // Gas fee
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(2, 32).endCell(),
    });
  }

  // OP 3: Refund to buyer
  async sendRefund(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano('0.05'), // Gas fee
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(3, 32).endCell(),
    });
  }

  // GET methods

  async getStatus(provider: ContractProvider): Promise<number> {
    const result = await provider.get('get_status', []);
    return result.stack.readNumber();
  }

  async getContractData(provider: ContractProvider): Promise<{
    seller: Address;
    buyer: Address;
    amount: bigint;
    timeout: number;
    status: number;
    admin: Address;
  }> {
    const result = await provider.get('get_contract_data', []);

    return {
      seller: result.stack.readAddress(),
      buyer: result.stack.readAddress(),
      amount: result.stack.readBigNumber(),
      timeout: result.stack.readNumber(),
      status: result.stack.readNumber(),
      admin: result.stack.readAddress(),
    };
  }

  async getSeller(provider: ContractProvider): Promise<Address> {
    const result = await provider.get('get_seller', []);
    return result.stack.readAddress();
  }

  async getBuyer(provider: ContractProvider): Promise<Address> {
    const result = await provider.get('get_buyer', []);
    return result.stack.readAddress();
  }

  async getAmount(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get('get_amount', []);
    return result.stack.readBigNumber();
  }

  async getTimeout(provider: ContractProvider): Promise<number> {
    const result = await provider.get('get_timeout', []);
    return result.stack.readNumber();
  }

  async isTimeoutPassed(provider: ContractProvider): Promise<boolean> {
    const result = await provider.get('is_timeout_passed', []);
    return result.stack.readNumber() !== 0;
  }

  async getAdmin(provider: ContractProvider): Promise<Address> {
    const result = await provider.get('get_admin', []);
    return result.stack.readAddress();
  }
}

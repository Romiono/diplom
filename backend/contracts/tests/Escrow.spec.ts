import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Address } from '@ton/core';
import { Escrow, EscrowStatus } from '../wrappers/Escrow';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Escrow', () => {
  let code: Cell;
  let blockchain: Blockchain;
  let escrow: SandboxContract<Escrow>;
  let seller: SandboxContract<TreasuryContract>;
  let buyer: SandboxContract<TreasuryContract>;
  let admin: SandboxContract<TreasuryContract>;

  beforeAll(async () => {
    code = await compile('Escrow');
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    seller = await blockchain.treasury('seller');
    buyer = await blockchain.treasury('buyer');
    admin = await blockchain.treasury('admin');

    const timeout = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

    escrow = blockchain.openContract(
      Escrow.createFromConfig(
        {
          sellerAddress: seller.address,
          buyerAddress: buyer.address,
          amount: toNano('10'),
          timeout,
          adminAddress: admin.address,
        },
        code,
      ),
    );

    const deployer = await blockchain.treasury('deployer');
    await escrow.sendDeploy(deployer.getSender(), toNano('0.05'));
  });

  it('should deploy', async () => {
    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.CREATED);
  });

  it('should get contract data', async () => {
    const data = await escrow.getContractData();

    expect(data.seller.toString()).toEqual(seller.address.toString());
    expect(data.buyer.toString()).toEqual(buyer.address.toString());
    expect(data.amount).toEqual(toNano('10'));
    expect(data.status).toEqual(EscrowStatus.CREATED);
  });

  it('buyer should fund escrow', async () => {
    await escrow.sendFund(buyer.getSender(), toNano('10'));

    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.FUNDED);
  });

  it('should reject funding from non-buyer', async () => {
    const result = await escrow.sendFund(seller.getSender(), toNano('10'));
    expect(result.transactions).toHaveTransaction({
      from: seller.address,
      to: escrow.address,
      success: false,
    });
  });

  it('should reject funding with insufficient amount', async () => {
    const result = await escrow.sendFund(buyer.getSender(), toNano('5'));
    expect(result.transactions).toHaveTransaction({
      from: buyer.address,
      to: escrow.address,
      success: false,
    });
  });

  it('buyer should release funds to seller', async () => {
    // First fund
    await escrow.sendFund(buyer.getSender(), toNano('10'));

    // Get seller balance before
    const sellerBalanceBefore = await seller.getBalance();

    // Release
    await escrow.sendRelease(buyer.getSender());

    // Check status
    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.RELEASED);

    // Check seller received funds
    const sellerBalanceAfter = await seller.getBalance();
    expect(sellerBalanceAfter).toBeGreaterThan(sellerBalanceBefore);
  });

  it('admin should release funds to seller', async () => {
    // First fund
    await escrow.sendFund(buyer.getSender(), toNano('10'));

    // Admin releases
    await escrow.sendRelease(admin.getSender());

    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.RELEASED);
  });

  it('admin should refund buyer', async () => {
    // First fund
    await escrow.sendFund(buyer.getSender(), toNano('10'));

    // Get buyer balance before
    const buyerBalanceBefore = await buyer.getBalance();

    // Admin refunds
    await escrow.sendRefund(admin.getSender());

    // Check status
    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.REFUNDED);

    // Check buyer received refund
    const buyerBalanceAfter = await buyer.getBalance();
    expect(buyerBalanceAfter).toBeGreaterThan(buyerBalanceBefore);
  });

  it('should reject release before funding', async () => {
    const result = await escrow.sendRelease(buyer.getSender());
    expect(result.transactions).toHaveTransaction({
      from: buyer.address,
      to: escrow.address,
      success: false,
    });
  });

  it('should reject unauthorized release', async () => {
    await escrow.sendFund(buyer.getSender(), toNano('10'));

    const stranger = await blockchain.treasury('stranger');
    const result = await escrow.sendRelease(stranger.getSender());

    expect(result.transactions).toHaveTransaction({
      from: stranger.address,
      to: escrow.address,
      success: false,
    });
  });

  it('should return excess if overpaid', async () => {
    const buyerBalanceBefore = await buyer.getBalance();

    // Send more than required
    await escrow.sendFund(buyer.getSender(), toNano('15'));

    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.FUNDED);

    // Buyer should receive excess back (minus gas fees)
    const buyerBalanceAfter = await buyer.getBalance();
    const spent = buyerBalanceBefore - buyerBalanceAfter;

    // Should spend approximately 10 TON + gas fees
    expect(spent).toBeLessThan(toNano('11'));
    expect(spent).toBeGreaterThan(toNano('10'));
  });

  it('should allow refund after timeout', async () => {
    await escrow.sendFund(buyer.getSender(), toNano('10'));

    // Fast-forward time by 31 days
    blockchain.now = Math.floor(Date.now() / 1000) + 31 * 24 * 60 * 60;

    // Check timeout passed
    const timeoutPassed = await escrow.isTimeoutPassed();
    expect(timeoutPassed).toBe(true);

    // Anyone can trigger refund after timeout
    const stranger = await blockchain.treasury('stranger');
    await escrow.sendRefund(stranger.getSender());

    const status = await escrow.getStatus();
    expect(status).toEqual(EscrowStatus.REFUNDED);
  });
});

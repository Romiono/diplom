import { toNano, Address } from '@ton/core';
import { Escrow } from '../wrappers/Escrow';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  // Example deployment
  // In production, these addresses should come from environment or parameters

  const sellerAddress = Address.parse(
    'EQD..._seller_address_here_...',
  ); // Replace with actual seller address
  const buyerAddress = Address.parse('EQD..._buyer_address_here_...');
// Replace with actual buyer address
  const adminAddress = Address.parse('EQD..._admin_address_here_...');
// Replace with actual admin address

  const amount = toNano('1'); // 1 TON
  const timeout = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

  const escrow = Escrow.createFromConfig(
    {
      sellerAddress,
      buyerAddress,
      amount,
      timeout,
      adminAddress,
    },
    await compile('Escrow'),
  );

  await provider.deploy(escrow, toNano('0.05'));

  const status = await escrow.getStatus(provider);
  console.log('Deployed escrow contract!');
  console.log('Address:', escrow.address);
  console.log('Status:', status);
  console.log('Amount:', amount);
  console.log('Timeout:', new Date(timeout * 1000));
}

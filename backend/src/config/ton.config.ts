import { registerAs } from '@nestjs/config';

export default registerAs('ton', () => ({
  network: process.env.TON_NETWORK || 'testnet',
  apiKey: process.env.TON_API_KEY || '',
  adminWalletMnemonic: process.env.TON_ADMIN_WALLET_MNEMONIC || '',
}));

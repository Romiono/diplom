/**
 * Скрипт для тестирования взаимодействия с TON блокчейном
 *
 * Использование:
 * ts-node -r tsconfig-paths/register scripts/test-blockchain.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EscrowService } from '../src/modules/blockchain/services/escrow.service';
import { TonClientService } from '../src/modules/blockchain/services/ton-client.service';

async function testBlockchain() {
  console.log('🚀 Starting TON Blockchain Integration Test...\n');

  // Создаем приложение
  const app = await NestFactory.createApplicationContext(AppModule);

  const escrowService = app.get(EscrowService);
  const tonClientService = app.get(TonClientService);

  try {
    console.log('1️⃣ Testing TON connection...');
    const client = await tonClientService.getClient();
    console.log('✅ Connected to TON network\n');

    console.log('2️⃣ Testing address validation...');
    const testAddress = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
    const isValid = await tonClientService.isValidAddress(testAddress);
    console.log(`Test address ${testAddress}: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);

    const SELLER_ADDRESS = process.env.TEST_SELLER_ADDRESS || 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
    const BUYER_ADDRESS = process.env.TEST_BUYER_ADDRESS || 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';

    console.log('3️⃣ Testing escrow contract deployment...');
    console.log(`Seller: ${SELLER_ADDRESS}`);
    console.log(`Buyer: ${BUYER_ADDRESS}`);
    console.log('Amount: 1 TON');
    console.log('Timeout: 30 days\n');

    console.log('⚠️  Contract deployment is commented out for safety');
    console.log('To deploy, uncomment the code below and ensure you have:');
    console.log('- Compiled contract (npm run contract:compile)');
    console.log('- Admin wallet mnemonic in .env');
    console.log('- Sufficient balance on admin wallet (>0.1 TON)\n');

    /*
    const contractAddress = await escrowService.deployEscrow({
      sellerAddress: SELLER_ADDRESS,
      buyerAddress: BUYER_ADDRESS,
      amount: 1, // 1 TON
      timeoutSeconds: 30 * 24 * 60 * 60, // 30 days
    });

    console.log(`✅ Contract deployed at: ${contractAddress}\n`);

    // 5. Получение состояния контракта
    console.log('5️⃣ Getting contract state...');
    const state = await escrowService.getContractState(contractAddress);
    console.log('Contract state:', JSON.stringify(state, null, 2));
    */

    console.log('✅ All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Set TEST_SELLER_ADDRESS and TEST_BUYER_ADDRESS in .env');
    console.log('2. Uncomment deployment code in this script');
    console.log('3. Run: ts-node -r tsconfig-paths/register scripts/test-blockchain.ts');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

testBlockchain().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

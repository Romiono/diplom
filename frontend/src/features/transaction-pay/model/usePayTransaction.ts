import { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beginCell } from '@ton/core';
import { transactionsApi } from '@entities/transaction/api/transactionsApi';
import { txKeys } from '@entities/transaction/model/queries';
import type { Transaction } from '@shared/types/api';

// Amount in nanoton + 0.05 TON gas buffer required by the escrow contract
const toNano = (amount: number) => String(Math.floor((Number(amount) + 0.05) * 1e9));

// Escrow fund opcode = 1 (32-bit uint), required by the smart contract
// Without this body the contract receives TON but stays in CREATED state
const buildFundPayload = (): string =>
  beginCell().storeUint(1, 32).endCell().toBoc().toString('base64');

export function usePayTransaction(tx: Transaction) {
  const [tonConnectUI] = useTonConnectUI();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const pay = async () => {
    if (!tx.escrow_contract_address) {
      toast.error('Адрес контракта не найден');
      return;
    }

    setIsPending(true);
    try {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min
        messages: [
          {
            address: tx.escrow_contract_address,
            amount: toNano(tx.amount),
            payload: buildFundPayload(), // opcode 1 → contract transitions CREATED → FUNDED
          },
        ],
      });

      // Register payment hash with backend
      try {
        await transactionsApi.updatePayment(tx.id, result.boc);
      } catch (updateErr: unknown) {
        // Payment went through on-chain but backend wasn't notified.
        // Show a specific error so the user knows what happened.
        const msg = updateErr instanceof Error ? updateErr.message : 'Unknown error';
        toast.error(`Транзакция отправлена, но статус не обновился: ${msg}. Обратитесь к поддержке.`);
        return;
      }

      queryClient.invalidateQueries({ queryKey: txKeys.detail(tx.id) });
      queryClient.invalidateQueries({ queryKey: txKeys.all });
      toast.success('Оплата отправлена!');
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== 'Reject request') {
        toast.error('Ошибка при отправке транзакции');
      }
    } finally {
      setIsPending(false);
    }
  };

  return { pay, isPending };
}

import { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transactionsApi } from '@entities/transaction/api/transactionsApi';
import { txKeys } from '@entities/transaction/model/queries';
import type { Transaction } from '@shared/types/api';

// Convert TON amount to nanoton string
const toNano = (amount: number) => String(Math.floor(amount * 1e9));

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
          },
        ],
      });

      // Register payment hash with backend
      await transactionsApi.updatePayment(tx.id, result.boc);

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

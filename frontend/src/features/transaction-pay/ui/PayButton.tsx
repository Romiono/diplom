'use client';
import { useTranslations } from 'next-intl';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTON } from '@shared/lib/utils';
import type { Transaction } from '@shared/types/api';
import { usePayTransaction } from '../model/usePayTransaction';

interface Props {
  transaction: Transaction;
}

export function PayButton({ transaction }: Props) {
  const t = useTranslations('transaction');
  const { pay, isPending } = usePayTransaction(transaction);

  if (transaction.status !== 'pending') return null;

  return (
    <Button onClick={pay} disabled={isPending} size="lg">
      <Wallet className="size-4 mr-2" />
      {isPending ? 'Ожидание...' : `${t('payNow')} · ${formatTON(transaction.amount)} TON`}
    </Button>
  );
}

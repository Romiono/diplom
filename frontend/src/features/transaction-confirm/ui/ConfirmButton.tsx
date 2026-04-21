'use client';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Transaction } from '@shared/types/api';
import { useConfirmTransaction } from '../model/useConfirmTransaction';

interface Props {
  transaction: Transaction;
  buyerId: string;
}

export function ConfirmButton({ transaction, buyerId }: Props) {
  const t = useTranslations('transaction');
  const tCommon = useTranslations('common');
  const { mutate, isPending } = useConfirmTransaction(transaction.id);

  if (transaction.status !== 'paid' || transaction.buyer_id !== buyerId) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="lg">
          <CheckCircle className="size-4 mr-2" />
          {t('confirmReceipt')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('confirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutate()} disabled={isPending}>
            {isPending ? t('confirming') : tCommon('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

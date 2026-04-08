'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Transaction } from '@shared/types/api';
import { useOpenDispute } from '../model/useOpenDispute';

interface Props {
  transaction: Transaction;
  currentUserId: string;
}

export function DisputeDialog({ transaction, currentUserId }: Props) {
  const t = useTranslations('transaction');
  const { mutate, isPending } = useOpenDispute(transaction.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Only buyer or seller can open dispute on a paid transaction
  const canDispute =
    transaction.status === 'paid' &&
    (transaction.buyer_id === currentUserId || transaction.seller_id === currentUserId);

  if (!canDispute) return null;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    mutate(reason.trim(), { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="text-destructive border-destructive hover:bg-destructive/10">
          <AlertTriangle className="size-4 mr-2" />
          {t('openDispute')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Открыть спор</DialogTitle>
          <DialogDescription>
            Опишите проблему. Администратор рассмотрит обращение и примет решение.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="dispute-reason">Причина *</Label>
          <Textarea
            id="dispute-reason"
            rows={4}
            placeholder="Опишите проблему подробно..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || !reason.trim()}
          >
            {isPending ? 'Открытие...' : 'Открыть спор'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

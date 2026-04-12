'use client';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTransaction } from '@entities/transaction';
import { TransactionStepper } from '@entities/transaction';
import { EscrowInfo } from '@entities/blockchain';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { PayButton } from '@features/transaction-pay';
import { ConfirmButton } from '@features/transaction-confirm';
import { DisputeDialog } from '@features/transaction-dispute';
import { CreateReviewForm } from '@features/review-create';
import { useTransactionReviews } from '@entities/review';
import { useAuthStore } from '@entities/user';
import { formatTON, formatDate } from '@shared/lib/utils';

interface Props {
  transactionId: string;
}

export function TransactionDetailView({ transactionId }: Props) {
  const locale = useLocale();
  const { data: tx, isLoading } = useTransaction(transactionId);
  const { data: reviews } = useTransactionReviews(transactionId);
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  if (!tx || !user) return null;

  const hasReview = reviews?.some((r) => r.reviewer_id === user.id);
  const isBuyer = user.id === tx.buyer_id;
  const counterparty = isBuyer ? tx.seller : tx.buyer;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Сделка</h1>
        <StatusBadge status={tx.status} ns="transaction" />
      </div>

      <TransactionStepper status={tx.status} />

      {/* Listing summary */}
      <div className="border rounded-lg p-4">
        <Link
          href={`/${locale}/listings/${tx.listing_id}`}
          className="font-medium hover:underline"
        >
          {tx.listing.title}
        </Link>
        <p className="text-2xl font-bold mt-1">{formatTON(tx.amount)}</p>
        <p className="text-sm text-muted-foreground">
          {isBuyer ? 'Продавец' : 'Покупатель'}:{' '}
          {counterparty.display_name ?? counterparty.username}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Создана: {formatDate(tx.created_at)}
        </p>
      </div>

      {/* Escrow contract */}
      {tx.escrow_contract_address && (
        <EscrowInfo contractAddress={tx.escrow_contract_address} />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isBuyer && <PayButton transaction={tx} />}
        {isBuyer && <ConfirmButton transaction={tx} buyerId={user.id} />}
        <DisputeDialog transaction={tx} currentUserId={user.id} />
      </div>

      {/* Review form after completion */}
      {tx.status === 'completed' && !hasReview && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Оставить отзыв</h3>
          <CreateReviewForm
            transactionId={tx.id}
            revieweeId={isBuyer ? tx.seller_id : tx.buyer_id}
          />
        </div>
      )}

      {/* Dispute info */}
      {tx.dispute_reason && (
        <div className="border border-destructive rounded-lg p-4 text-sm">
          <p className="font-medium text-destructive">Причина спора:</p>
          <p className="text-muted-foreground mt-1">{tx.dispute_reason}</p>
          {tx.dispute_opened_at && (
            <p className="text-xs mt-2">
              Открыт: {formatDate(tx.dispute_opened_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { formatTON, formatRelative } from '@shared/lib/utils';
import type { Transaction } from '@shared/types/api';

interface Props {
  transaction: Transaction;
  currentUserId?: string;
}

export function TransactionCard({ transaction, currentUserId }: Props) {
  const isBuyer = transaction.buyer_id === currentUserId;
  const counterparty = isBuyer ? transaction.seller : transaction.buyer;
  const counterpartyName =
    counterparty.display_name ?? counterparty.username ?? counterparty.wallet_address.slice(0, 10) + '…';

  return (
    <Link href={`/transactions/${transaction.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium text-sm truncate">{transaction.listing.title}</p>
            <p className="text-xs text-muted-foreground">
              {isBuyer ? 'Seller' : 'Buyer'}: {counterpartyName}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelative(transaction.created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={transaction.status} ns="transaction" />
            <span className="text-sm font-semibold">{formatTON(transaction.amount)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

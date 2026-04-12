import { TransactionDetailView } from '@widgets/transaction-detail-view';

interface Props {
  id: string;
}

export function TransactionDetailPage({ id }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <TransactionDetailView transactionId={id} />
    </div>
  );
}

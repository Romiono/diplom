'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTransactions } from '@entities/transaction';
import { TransactionCard } from '@entities/transaction';
import { useAuthStore } from '@entities/user';
import { PaginationControls } from '@shared/ui/PaginationControls';
import { EmptyState } from '@shared/ui/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt } from 'lucide-react';

export function TransactionsListPage() {
  const t = useTranslations('transaction');
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();
  const { data, isLoading } = useTransactions(page);

  const all = data?.data ?? [];
  const purchases = all.filter((t) => t.buyer_id === user?.id);
  const sales = all.filter((t) => t.seller_id === user?.id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <Tabs defaultValue="purchases">
        <TabsList className="mb-4">
          <TabsTrigger value="purchases">
            {t('purchases')} ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="sales">
            {t('sales')} ({sales.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          {purchases.length === 0 ? (
            <EmptyState icon={<Receipt className="size-10" />} title={t('noPurchases')} />
          ) : (
            <div className="space-y-3">
              {purchases.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} currentUserId={user?.id} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales">
          {sales.length === 0 ? (
            <EmptyState icon={<Receipt className="size-10" />} title={t('noSales')} />
          ) : (
            <div className="space-y-3">
              {sales.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} currentUserId={user?.id} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {data && data.totalPages > 1 && (
        <PaginationControls
          page={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

import { setRequestLocale } from 'next-intl/server';
import { TransactionDetailPage } from '@pages/transaction-detail/ui/TransactionDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  return <TransactionDetailPage id={id} />;
}

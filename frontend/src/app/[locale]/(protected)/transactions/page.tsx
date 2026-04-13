import { setRequestLocale } from 'next-intl/server';
import { TransactionsListPage } from '@pages/transactions-list/ui/TransactionsListPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TransactionsListPage />;
}

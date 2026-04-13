import { setRequestLocale } from 'next-intl/server';
import { MessagesListPage } from '@pages/messages-list/ui/MessagesListPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MessagesListPage />;
}

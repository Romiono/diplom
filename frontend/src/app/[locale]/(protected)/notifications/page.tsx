import { setRequestLocale } from 'next-intl/server';
import { NotificationsPage } from '@pages/notifications/ui/NotificationsPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationsPage />;
}

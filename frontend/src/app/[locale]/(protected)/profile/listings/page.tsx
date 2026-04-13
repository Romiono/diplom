import { setRequestLocale } from 'next-intl/server';
import { MyListingsPage } from '@pages/my-listings/ui/MyListingsPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MyListingsPage />;
}

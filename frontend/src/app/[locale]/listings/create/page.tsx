import { setRequestLocale } from 'next-intl/server';
import { ListingCreatePage } from '@pages/listing-create/ui/ListingCreatePage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ListingCreatePage />;
}

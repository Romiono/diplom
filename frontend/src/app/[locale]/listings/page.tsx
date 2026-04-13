import { setRequestLocale } from 'next-intl/server';
import { ListingsCatalogPage } from '@pages/listings-catalog/ui/ListingsCatalogPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ListingsCatalogPage />;
}

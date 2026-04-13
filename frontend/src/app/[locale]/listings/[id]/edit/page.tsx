import { setRequestLocale } from 'next-intl/server';
import { ListingEditPage } from '@pages/listing-edit/ui/ListingEditPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  return <ListingEditPage id={id} />;
}

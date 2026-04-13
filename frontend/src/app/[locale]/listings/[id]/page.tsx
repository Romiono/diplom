import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ListingDetailPage } from '@pages/listing-detail/ui/ListingDetailPage';
import { env } from '@shared/config/env';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await fetch(`${env.apiUrl}/listings/${id}`, {
      next: { revalidate: 60 },
    }).then((r) => (r.ok ? r.json() : null));

    if (listing) {
      return {
        title: `${listing.title} — TON Market`,
        description: listing.description?.slice(0, 160) ?? undefined,
      };
    }
  } catch {
    // fall through to default
  }
  return { title: 'Объявление — TON Market' };
}

export default async function Page({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  return <ListingDetailPage id={id} />;
}

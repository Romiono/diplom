import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ListingsFeed } from '@widgets/listings-feed';

export function ListingsCatalogPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('nav.listings')}</h1>
      <Suspense>
        <ListingsFeed />
      </Suspense>
    </div>
  );
}

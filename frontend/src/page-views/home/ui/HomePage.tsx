import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ListingsFeed } from '@widgets/listings-feed';

export function HomePage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">TON Marketplace</h1>
        <p className="text-muted-foreground">{t('home.subtitle')}</p>
      </section>
      <Suspense>
        <ListingsFeed />
      </Suspense>
    </div>
  );
}

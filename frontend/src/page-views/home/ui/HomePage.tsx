import { Suspense } from 'react';
import { ListingsFeed } from '@widgets/listings-feed';

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">TON Marketplace</h1>
        <p className="text-muted-foreground">
          Безопасная торговля с эскроу на блокчейне TON
        </p>
      </section>
      <Suspense>
        <ListingsFeed />
      </Suspense>
    </div>
  );
}

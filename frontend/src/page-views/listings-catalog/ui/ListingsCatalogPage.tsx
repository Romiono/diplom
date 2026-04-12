import { Suspense } from 'react';
import { ListingsFeed } from '@widgets/listings-feed';

export function ListingsCatalogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Объявления</h1>
      <Suspense>
        <ListingsFeed />
      </Suspense>
    </div>
  );
}

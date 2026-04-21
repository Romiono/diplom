'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@entities/user';
import { useUserListings, ListingGrid } from '@entities/listing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ListingStatus } from '@shared/types/api';

type Tab = { value: ListingStatus | 'all'; labelKey: string };

const STATUS_TABS: Tab[] = [
  { value: 'all', labelKey: 'listing.tabs.all' },
  { value: 'active', labelKey: 'listing.tabs.active' },
  { value: 'sold', labelKey: 'listing.tabs.sold' },
  { value: 'reserved', labelKey: 'listing.tabs.reserved' },
];

export function MyListingsView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const [page] = useState(1);
  const { data } = useUserListings(user?.id ?? '', page);

  const listings = data?.data ?? [];

  return (
    <Tabs defaultValue="all">
      <TabsList>
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </TabsTrigger>
        ))}
      </TabsList>
      {STATUS_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <ListingGrid
            listings={
              tab.value === 'all'
                ? listings
                : listings.filter((l) => l.status === tab.value)
            }
            isLoading={!data}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

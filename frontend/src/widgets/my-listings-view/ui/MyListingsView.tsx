'use client';
import { useState } from 'react';
import { useAuthStore } from '@entities/user';
import { useUserListings, ListingGrid } from '@entities/listing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ListingStatus } from '@shared/types/api';

const STATUS_TABS: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'sold', label: 'Проданные' },
  { value: 'reserved', label: 'Зарезервированные' },
];

export function MyListingsView() {
  const { user } = useAuthStore();
  const [page] = useState(1);
  const { data } = useUserListings(user?.id ?? '', page);

  const listings = data?.data ?? [];

  return (
    <Tabs defaultValue="all">
      <TabsList>
        {STATUS_TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {STATUS_TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-4">
          <ListingGrid
            listings={
              t.value === 'all'
                ? listings
                : listings.filter((l) => l.status === t.value)
            }
            isLoading={!data}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

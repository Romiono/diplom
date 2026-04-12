'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ListingGrid } from '@entities/listing';
import { PaginationControls } from '@shared/ui/PaginationControls';
import { ListingsFilter } from '@features/listings-filter';
import { useListings } from '@entities/listing';
import type { ListingSearchParams } from '@shared/types/api';

export function ListingsFeed() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);

  const params: ListingSearchParams = {
    query: searchParams?.get('query') ?? undefined,
    category_id: searchParams?.get('category_id')
      ? Number(searchParams.get('category_id'))
      : undefined,
    minPrice: searchParams?.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : undefined,
    maxPrice: searchParams?.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : undefined,
    condition: (searchParams?.get('condition') as ListingSearchParams['condition']) ?? undefined,
    sortBy: (searchParams?.get('sortBy') as ListingSearchParams['sortBy']) ?? undefined,
    sortOrder: (searchParams?.get('sortOrder') as 'ASC' | 'DESC') ?? undefined,
    page,
    limit: 20,
  };

  const { data, isLoading } = useListings(params);

  return (
    <div className="flex gap-6">
      {/* Desktop sidebar filter */}
      <aside className="hidden lg:block w-64 shrink-0">
        <ListingsFilter />
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile filter sheet */}
        <div className="lg:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="size-4 mr-2" />
                Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ListingsFilter />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <ListingGrid listings={data?.data ?? []} isLoading={isLoading} />

        {data && data.totalPages > 1 && (
          <PaginationControls
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

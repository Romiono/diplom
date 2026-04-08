import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from './ListingCard';
import type { Listing } from '@shared/types/api';

interface Props {
  listings: Listing[];
  isLoading?: boolean;
  skeletonCount?: number;
  renderActions?: (listing: Listing) => React.ReactNode;
  emptyState?: React.ReactNode;
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function ListingGrid({
  listings,
  isLoading,
  skeletonCount = 8,
  renderActions,
  emptyState,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!listings.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          actions={renderActions?.(listing)}
        />
      ))}
    </div>
  );
}

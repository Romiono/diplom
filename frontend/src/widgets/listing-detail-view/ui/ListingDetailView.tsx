'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListing } from '@entities/listing';
import { ListingImageGallery } from '@entities/listing';
import { CategoryBadge } from '@entities/category';
import { UserCard } from '@entities/user';
import { useUserReviews, ReviewCard } from '@entities/review';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { BuyButton } from '@features/listing-buy';
import { DeleteListingButton } from '@features/listing-delete';
import { useAuthStore } from '@entities/user';
import { formatTON, formatDate } from '@shared/lib/utils';

interface Props {
  listingId: string;
}

export function ListingDetailView({ listingId }: Props) {
  const t = useTranslations('listing');
  const locale = useLocale();
  const { data: listing, isLoading } = useListing(listingId);
  const { data: reviews } = useUserReviews(listing?.seller.id ?? '');
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/4" />
      </div>
    );
  }

  if (!listing) return null;

  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ListingImageGallery listing={listing} />

      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <StatusBadge status={listing.status} ns="listing" />
          </div>
          <p className="text-3xl font-bold text-primary">{formatTON(listing.price)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(listing.created_at)}
          </p>
        </div>

        {listing.category && <CategoryBadge category={listing.category} asLink />}

        <p className="text-muted-foreground whitespace-pre-wrap">
          {listing.description}
        </p>

        {listing.location && (
          <p className="text-sm">📍 {listing.location}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {listing.status === 'active' && !isOwner && (
            <BuyButton
              listingId={listing.id}
              price={listing.price}
              sellerId={listing.seller_id}
            />
          )}
          {isOwner && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/${locale}/listings/${listing.id}/edit`}>
                  <Edit className="size-4 mr-2" />
                  {t('edit')}
                </Link>
              </Button>
              <DeleteListingButton listingId={listing.id} />
            </>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Продавец</p>
          <UserCard user={listing.seller} />
        </div>

        {reviews && reviews.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Отзывы о продавце</h3>
            <div className="space-y-3">
              {reviews.slice(0, 3).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

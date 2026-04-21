'use client';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { MapPin, Eye } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { formatTON, formatRelative } from '@shared/lib/utils';
import { getPrimaryImage } from '../lib/listing.utils';
import type { Listing } from '@shared/types/api';

interface Props {
  listing: Listing;
  actions?: React.ReactNode;
}

export function ListingCard({ listing, actions }: Props) {
  const locale = useLocale();
  const t = useTranslations('listing');
  const imageUrl = getPrimaryImage(listing);
  const seller = listing.seller;
  const sellerName = seller
    ? (seller.display_name ?? seller.username ?? seller.wallet_address.slice(0, 8) + '…')
    : '—';

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              {t('noImage')}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <StatusBadge status={listing.status} ns="listing" />
          </div>
        </div>
      </Link>

      <CardContent className="p-3 space-y-2">
        <Link href={`/listings/${listing.id}`} className="block">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>

        <p className="text-base font-bold">{formatTON(listing.price)}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[60%]">{sellerName}</span>
          <div className="flex items-center gap-2 shrink-0">
            {listing.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Eye className="size-3" />
              {listing.views_count}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{formatRelative(listing.created_at, locale)}</p>

        {actions && <div className="pt-1 border-t">{actions}</div>}
      </CardContent>
    </Card>
  );
}

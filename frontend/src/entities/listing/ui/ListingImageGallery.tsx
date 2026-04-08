'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn, toAbsoluteUrl } from '@shared/lib/utils';
import { getSortedImages } from '../lib/listing.utils';
import type { Listing } from '@shared/types/api';

interface Props {
  listing: Listing;
}

export function ListingImageGallery({ listing }: Props) {
  const images = getSortedImages(listing);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
        No images
      </div>
    );
  }

  const activeUrl = toAbsoluteUrl(images[activeIdx].image_url);

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        <Image
          src={activeUrl}
          alt={`${listing.title} — image ${activeIdx + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={activeIdx === 0}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'relative shrink-0 size-16 rounded-md overflow-hidden border-2 transition-colors',
                i === activeIdx ? 'border-primary' : 'border-transparent',
              )}
            >
              <Image
                src={toAbsoluteUrl(img.image_url)}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Listing } from '@shared/types/api';
import { toAbsoluteUrl } from '@shared/lib/utils';

export const getPrimaryImage = (listing: Listing): string => {
  const sorted = [...listing.images].sort((a, b) => a.order_index - b.order_index);
  const primary = sorted.find((i) => i.is_primary) ?? sorted[0];
  return primary ? toAbsoluteUrl(primary.image_url) : '';
};

export const getSortedImages = (listing: Listing) =>
  [...listing.images].sort((a, b) => a.order_index - b.order_index);

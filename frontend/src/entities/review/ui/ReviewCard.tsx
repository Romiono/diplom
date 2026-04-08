import { formatRelative } from '@shared/lib/utils';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import { StarRating } from './StarRating';
import type { Review } from '@shared/types/api';

interface Props {
  review: Review;
}

export function ReviewCard({ review }: Props) {
  const name = review.reviewer.display_name ?? review.reviewer.username ?? 'User';

  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <UserAvatar user={review.reviewer} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelative(review.created_at)}
          </span>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
        {review.comment && (
          <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

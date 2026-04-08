import Link from 'next/link';
import { Star } from 'lucide-react';
import { truncateAddress } from '@shared/lib/utils';
import { UserAvatar } from './UserAvatar';
import type { User } from '@shared/types/api';

type UserSlice = Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url' | 'rating'>;

interface Props {
  user: UserSlice;
  showRating?: boolean;
}

export function UserCard({ user, showRating = true }: Props) {
  const name = user.display_name ?? user.username ?? truncateAddress(user.wallet_address);

  return (
    <Link href={`/users/${user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
      <UserAvatar user={user} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{truncateAddress(user.wallet_address)}</p>
      </div>
      {showRating && (
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground shrink-0">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{user.rating.toFixed(1)}</span>
        </div>
      )}
    </Link>
  );
}

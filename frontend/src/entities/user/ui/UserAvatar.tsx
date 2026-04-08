import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@shared/lib/utils';
import { toAbsoluteUrl } from '@shared/lib/utils';

interface Props {
  user: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-14',
} as const;

function getInitials(user: Props['user']): string {
  const name = user.display_name ?? user.username ?? '?';
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({ user, size = 'md', className }: Props) {
  const src = user.avatar_url ? toAbsoluteUrl(user.avatar_url) : undefined;

  return (
    <Avatar className={cn(SIZE_CLASS[size], className)}>
      {src && <AvatarImage src={src} alt={user.display_name ?? user.username ?? ''} />}
      <AvatarFallback className="text-xs font-medium">{getInitials(user)}</AvatarFallback>
    </Avatar>
  );
}

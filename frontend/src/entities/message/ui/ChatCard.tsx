import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { formatRelative, toAbsoluteUrl } from '@shared/lib/utils';
import type { Chat } from '@shared/types/api';

interface Props {
  chat: Chat;
}

function getChatImage(chat: Chat): string {
  const images = [...(chat.listing.images ?? [])].sort((a, b) => a.order_index - b.order_index);
  const primary = images.find((i) => i.is_primary) ?? images[0];
  return primary ? toAbsoluteUrl(primary.image_url) : '';
}

export function ChatCard({ chat }: Props) {
  const locale = useLocale();
  const { listing, lastMessage } = chat;
  const imageUrl = getChatImage(chat);

  return (
    <Link
      href={`/messages/${listing.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
    >
      <div className="relative size-12 shrink-0 rounded-md overflow-hidden bg-muted">
        {imageUrl && (
          <Image src={imageUrl} alt={listing.title} fill className="object-cover" sizes="48px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{listing.title}</p>
        <p className="text-xs text-muted-foreground truncate">{lastMessage.content}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatRelative(lastMessage.created_at, locale)}
      </span>
    </Link>
  );
}

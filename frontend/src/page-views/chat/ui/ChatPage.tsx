'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, MessageSquareOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatRoom } from '@widgets/chat-room';
import { useListing } from '@entities/listing';
import { useMessageHistory } from '@entities/message';
import { useAuthStore } from '@entities/user';

interface Props {
  listingId: string;
}

export function ChatPage({ listingId }: Props) {
  const locale = useLocale();
  const t = useTranslations('message');
  const { user } = useAuthStore();
  const { data: listing, isLoading: listingLoading } = useListing(listingId);
  const { data: history, isLoading: historyLoading } = useMessageHistory(listingId);

  const isLoading = listingLoading || historyLoading;

  
  
  
  
  const receiverId = (() => {
    if (!user) return null;
    const messages = history?.data ?? [];
    const other = messages.find(
      (m) => m.sender_id !== user.id || m.receiver_id !== user.id,
    );
    if (other) {
      return other.sender_id === user.id ? other.receiver_id : other.sender_id;
    }
    
    if (listing && listing.seller_id !== user.id) {
      return listing.seller_id;
    }
    return null;
  })();

  const sellerName =
    listing?.seller.display_name ??
    listing?.seller.username ??
    listing?.seller.wallet_address?.slice(0, 10) + '…';

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-3 border-b mb-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/messages`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {listing?.title ?? '…'}
          </p>
          <p className="text-xs text-muted-foreground">
            {sellerName ?? '…'}
          </p>
        </div>
        {listing && (
          <Button variant="outline" size="sm" asChild className="ml-auto shrink-0">
            <Link href={`/${locale}/listings/${listingId}`}>
              {t('toListing')}
            </Link>
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : receiverId ? (
          <ChatRoom listingId={listingId} receiverId={receiverId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquareOff className="size-10" />
            <p className="text-sm">{t('noMessages')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

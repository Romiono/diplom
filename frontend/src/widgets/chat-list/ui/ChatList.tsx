'use client';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { useChats } from '@entities/message';
import { ChatCard } from '@entities/message';
import { EmptyState } from '@shared/ui/EmptyState';

export function ChatList() {
  const t = useTranslations('message');
  const { data: chats } = useChats();

  if (!chats?.length) {
    return <EmptyState icon={<MessageSquare className="size-10" />} title={t('noChats')} />;
  }

  return (
    <div className="space-y-1">
      {chats.map((chat) => (
        <ChatCard key={chat.listing.id} chat={chat} />
      ))}
    </div>
  );
}

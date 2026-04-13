import { setRequestLocale } from 'next-intl/server';
import { ChatPage } from '@pages/chat/ui/ChatPage';

export default async function Page({
  params,
}: {
  params: Promise<{ listingId: string; locale: string }>;
}) {
  const { listingId, locale } = await params;
  setRequestLocale(locale);
  return <ChatPage listingId={listingId} />;
}

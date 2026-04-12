import { ChatPage } from '@pages/chat/ui/ChatPage';

export default async function Page({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  return <ChatPage listingId={listingId} />;
}

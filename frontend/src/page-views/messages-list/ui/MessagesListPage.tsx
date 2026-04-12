import { ChatList } from '@widgets/chat-list';

export function MessagesListPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Сообщения</h1>
      <ChatList />
    </div>
  );
}

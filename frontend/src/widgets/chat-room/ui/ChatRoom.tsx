'use client';
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@entities/message';
import { useAuthStore } from '@entities/user';
import { useChat } from '../model/useChat';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  listingId: string;
  receiverId: string;
}

export function ChatRoom({ listingId, receiverId }: Props) {
  const { user } = useAuthStore();
  const { messages, isTyping, connected, sendMessage, sendTyping } =
    useChat(listingId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(receiverId, text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            sendTyping();
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Написать сообщение..."
          disabled={!connected}
        />
        <Button
          onClick={handleSend}
          disabled={!connected || !text.trim()}
          size="icon"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@entities/user';
import { useMessageHistory } from '@entities/message';
import { env } from '@shared/config/env';
import type { Message } from '@shared/types/api';

export function useChat(listingId: string) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const { data: historyData } = useMessageHistory(listingId);

  useEffect(() => {
    if (!token) return;

    const socket = io(env.wsUrl, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { listingId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('message:new', (msg: Message) =>
      setRealtimeMessages((prev) => [...prev, msg]),
    );

    socket.on('message:typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, listingId]);

  const sendMessage = (receiverId: string, content: string) => {
    socketRef.current?.emit('message:send', {
      listing_id: listingId,
      receiver_id: receiverId,
      content,
    });
  };

  const sendTyping = () => {
    socketRef.current?.emit('message:typing', { listingId });
  };

  // Дедупликация: история + realtime
  const historyMessages = historyData?.data ?? [];
  const realtimeIds = new Set(realtimeMessages.map((m) => m.id));
  const allMessages = [
    ...historyMessages.filter((m) => !realtimeIds.has(m.id)),
    ...realtimeMessages,
  ].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return { messages: allMessages, isTyping, connected, sendMessage, sendTyping };
}

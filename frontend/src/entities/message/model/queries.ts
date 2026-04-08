import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';

export const messageKeys = {
  chats: () => ['messages', 'chats'] as const,
  history: (listingId: string) => ['messages', 'history', listingId] as const,
};

export const useChats = () =>
  useQuery({
    queryKey: messageKeys.chats(),
    queryFn: messagesApi.getChats,
  });

export const useMessageHistory = (listingId: string) =>
  useQuery({
    queryKey: messageKeys.history(listingId),
    queryFn: () => messagesApi.getHistory(listingId),
    enabled: !!listingId,
  });

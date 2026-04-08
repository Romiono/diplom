import { apiFetch } from '@shared/api/client';
import type { Chat, Message, PaginatedResult } from '@shared/types/api';

export const messagesApi = {
  getChats: () => apiFetch<Chat[]>('/messages/chats'),

  getHistory: (listingId: string, page = 1, limit = 50) =>
    apiFetch<PaginatedResult<Message>>(
      `/messages/history/${listingId}?page=${page}&limit=${limit}`,
    ),
};

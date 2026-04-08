import { apiFetch } from '@shared/api/client';
import type { Transaction, PaginatedResult } from '@shared/types/api';

export const transactionsApi = {
  create: (listingId: string) =>
    apiFetch<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId }),
    }),

  getAll: (page = 1, limit = 20) =>
    apiFetch<PaginatedResult<Transaction>>(
      `/transactions?page=${page}&limit=${limit}`,
    ),

  getById: (id: string) => apiFetch<Transaction>(`/transactions/${id}`),

  confirm: (id: string) =>
    apiFetch<{ message: string }>(`/transactions/${id}/confirm`, {
      method: 'POST',
    }),

  openDispute: (id: string, reason: string) =>
    apiFetch<{ message: string }>(`/transactions/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  updatePayment: (id: string, txHash: string) =>
    apiFetch<{ message: string }>(`/transactions/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ txHash, blockNumber: 0 }),
    }),
};

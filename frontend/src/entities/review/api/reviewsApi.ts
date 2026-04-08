import { apiFetch } from '@shared/api/client';
import type { Review } from '@shared/types/api';

export const reviewsApi = {
  create: (data: { transaction_id: string; rating: number; comment?: string }) =>
    apiFetch<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByUser: (userId: string) => apiFetch<Review[]>(`/reviews/user/${userId}`),

  getByTransaction: (txId: string) =>
    apiFetch<Review[]>(`/reviews/transaction/${txId}`),
};

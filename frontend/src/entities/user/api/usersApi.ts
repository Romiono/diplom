import { apiFetch } from '@shared/api/client';
import type { User, AuthResponse } from '@shared/types/api';

export const usersApi = {
  getNonce: (walletAddress: string) =>
    apiFetch<{ nonce: string }>(`/auth/nonce?walletAddress=${encodeURIComponent(walletAddress)}`),

  tonConnect: (data: {
    walletAddress: string;
    publicKey: string;
    signature: string;
    payload: string;
    timestamp?: number;
    domain?: string;
    domainLen?: number;
  }) =>
    apiFetch<AuthResponse>('/auth/ton-connect', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) => apiFetch<User>(`/users/${id}`),

  update: (
    id: string,
    data: Partial<{
      username: string;
      display_name: string;
      email: string;
      avatar_url: string;
    }>,
  ) =>
    apiFetch<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

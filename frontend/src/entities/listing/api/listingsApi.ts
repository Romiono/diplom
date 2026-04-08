import { apiFetch } from '@shared/api/client';
import type { Listing, PaginatedResult, ListingSearchParams } from '@shared/types/api';

export const listingsApi = {
  search: (params: ListingSearchParams) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiFetch<PaginatedResult<Listing>>(`/listings?${qs}`);
  },

  getById: (id: string) => apiFetch<Listing>(`/listings/${id}`),

  getUserListings: (userId: string, page = 1, limit = 20) =>
    apiFetch<PaginatedResult<Listing>>(
      `/listings/user/${userId}?page=${page}&limit=${limit}`,
    ),

  create: (data: {
    title: string;
    description: string;
    price: number;
    category_id?: number;
    condition?: string;
    location?: string;
    image_urls?: string[];
  }) =>
    apiFetch<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      price: number;
      category_id: number | null;
      condition: string;
      location: string;
      image_urls: string[];
    }>,
  ) =>
    apiFetch<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/listings/${id}`, { method: 'DELETE' }),
};

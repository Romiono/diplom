import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../api/listingsApi';
import type { ListingSearchParams } from '@shared/types/api';

export const listingKeys = {
  all: ['listings'] as const,
  search: (p: ListingSearchParams) => ['listings', 'search', p] as const,
  detail: (id: string) => ['listings', id] as const,
  user: (userId: string, page: number) => ['listings', 'user', userId, page] as const,
};

export const useListings = (params: ListingSearchParams) =>
  useQuery({
    queryKey: listingKeys.search(params),
    queryFn: () => listingsApi.search(params),
    staleTime: 30_000,
  });

export const useListing = (id: string) =>
  useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => listingsApi.getById(id),
    enabled: !!id,
  });

export const useUserListings = (userId: string, page = 1) =>
  useQuery({
    queryKey: listingKeys.user(userId, page),
    queryFn: () => listingsApi.getUserListings(userId, page),
    enabled: !!userId,
  });

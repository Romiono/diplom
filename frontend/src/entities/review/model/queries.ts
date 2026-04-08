import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviewsApi';

export const reviewKeys = {
  byUser: (userId: string) => ['reviews', 'user', userId] as const,
  byTransaction: (txId: string) => ['reviews', 'tx', txId] as const,
};

export const useUserReviews = (userId: string) =>
  useQuery({
    queryKey: reviewKeys.byUser(userId),
    queryFn: () => reviewsApi.getByUser(userId),
    enabled: !!userId,
  });

export const useTransactionReviews = (txId: string) =>
  useQuery({
    queryKey: reviewKeys.byTransaction(txId),
    queryFn: () => reviewsApi.getByTransaction(txId),
    enabled: !!txId,
  });

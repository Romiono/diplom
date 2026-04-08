import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reviewsApi } from '@entities/review/api/reviewsApi';
import { reviewKeys } from '@entities/review/model/queries';

interface CreateReviewData {
  transactionId: string;
  rating: number;
  comment?: string;
}

export function useCreateReview(revieweeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, rating, comment }: CreateReviewData) =>
      reviewsApi.create({ transaction_id: transactionId, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byUser(revieweeId) });
      toast.success('Отзыв отправлен!');
    },
    onError: () => toast.error('Не удалось отправить отзыв'),
  });
}

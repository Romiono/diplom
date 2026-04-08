import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { transactionsApi } from '@entities/transaction/api/transactionsApi';
import { txKeys } from '@entities/transaction/model/queries';

export function useBuyListing(listingId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();

  return useMutation({
    mutationFn: () => transactionsApi.create(listingId),
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: txKeys.all });
      toast.success('Сделка создана! Перейдите к оплате.');
      router.push(`/${locale}/transactions/${tx.id}`);
    },
    onError: () => toast.error('Не удалось создать сделку'),
  });
}

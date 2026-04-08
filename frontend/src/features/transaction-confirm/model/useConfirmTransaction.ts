import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transactionsApi } from '@entities/transaction/api/transactionsApi';
import { txKeys } from '@entities/transaction/model/queries';

export function useConfirmTransaction(txId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => transactionsApi.confirm(txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txKeys.detail(txId) });
      queryClient.invalidateQueries({ queryKey: txKeys.all });
      toast.success('Получение подтверждено! Средства переведены продавцу.');
    },
    onError: () => toast.error('Не удалось подтвердить получение'),
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transactionsApi } from '@entities/transaction/api/transactionsApi';
import { txKeys } from '@entities/transaction/model/queries';

export function useOpenDispute(txId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) => transactionsApi.openDispute(txId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txKeys.detail(txId) });
      queryClient.invalidateQueries({ queryKey: txKeys.all });
      toast.success('Спор открыт. Администратор рассмотрит обращение.');
    },
    onError: () => toast.error('Не удалось открыть спор'),
  });
}

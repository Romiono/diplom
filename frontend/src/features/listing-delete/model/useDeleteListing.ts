import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { listingsApi } from '@entities/listing/api/listingsApi';
import { listingKeys } from '@entities/listing/model/queries';

export function useDeleteListing(listingId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();

  return useMutation({
    mutationFn: () => listingsApi.remove(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      toast.success('Объявление удалено');
      router.push(`/${locale}/listings`);
    },
    onError: () => toast.error('Не удалось удалить объявление'),
  });
}

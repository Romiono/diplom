import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { listingsApi } from '@entities/listing/api/listingsApi';
import { listingKeys } from '@entities/listing/model/queries';
import { apiFetch } from '@shared/api/client';

export interface CreateListingFields {
  title: string;
  description: string;
  price: number;
  category_id?: number;
  condition?: string;
  location?: string;
  images: File[];
}

async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    const res = await apiFetch<{ url: string }>('/files/upload', { method: 'POST', body: form });
    urls.push(res.url);
  }
  return urls;
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();

  return useMutation({
    mutationFn: async (fields: CreateListingFields) => {
      const image_urls = fields.images.length > 0 ? await uploadImages(fields.images) : [];
      return listingsApi.create({
        title: fields.title,
        description: fields.description,
        price: fields.price,
        category_id: fields.category_id,
        condition: fields.condition,
        location: fields.location,
        image_urls,
      });
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      toast.success('Объявление создано');
      router.push(`/${locale}/listings/${listing.id}`);
    },
    onError: () => toast.error('Не удалось создать объявление'),
  });
}

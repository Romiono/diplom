import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listingsApi } from '@entities/listing/api/listingsApi';
import { listingKeys } from '@entities/listing/model/queries';
import { apiFetch } from '@shared/api/client';

export interface EditListingFields {
  title?: string;
  description?: string;
  price?: number;
  category_id?: number | null;
  condition?: string;
  location?: string;
  newImages?: File[];
  existingImageUrls?: string[];
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

export function useEditListing(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fields: EditListingFields) => {
      const newUrls = fields.newImages?.length ? await uploadImages(fields.newImages) : [];
      const image_urls = [...(fields.existingImageUrls ?? []), ...newUrls];

      return listingsApi.update(listingId, {
        title: fields.title,
        description: fields.description,
        price: fields.price,
        category_id: fields.category_id,
        condition: fields.condition,
        location: fields.location,
        ...(image_urls.length > 0 && { image_urls }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      toast.success('Объявление обновлено');
    },
    onError: () => toast.error('Не удалось обновить объявление'),
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@entities/user/api/usersApi';
import { userKeys } from '@entities/user/model/queries';
import { apiFetch } from '@shared/api/client';

export interface EditProfileFields {
  username?: string;
  display_name?: string;
  email?: string;
  avatarFile?: File;
  avatar_url?: string;
}

export function useEditProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fields: EditProfileFields) => {
      let avatar_url = fields.avatar_url;

      if (fields.avatarFile) {
        const form = new FormData();
        form.append('file', fields.avatarFile);
        const res = await apiFetch<{ url: string }>('/files/upload', { method: 'POST', body: form });
        avatar_url = res.url;
      }

      return usersApi.update(userId, {
        username: fields.username || undefined,
        display_name: fields.display_name || undefined,
        email: fields.email || undefined,
        avatar_url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      toast.success('Профиль обновлён');
    },
    onError: () => toast.error('Не удалось обновить профиль'),
  });
}

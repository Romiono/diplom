'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import type { User } from '@shared/types/api';
import { useEditProfile } from '../model/useEditProfile';

interface Props {
  user: User;
  onSuccess?: () => void;
}

export function EditProfileForm({ user, onSuccess }: Props) {
  const t = useTranslations('profile');
  const { mutate, isPending } = useEditProfile(user.id);

  const [username, setUsername] = useState(user.username ?? '');
  const [displayName, setDisplayName] = useState(user.display_name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (file: File | null) => {
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        username: username || undefined,
        display_name: displayName || undefined,
        email: email || undefined,
        avatarFile,
        avatar_url: user.avatar_url ?? undefined,
      },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="flex items-center gap-4">
        <div className="relative">
          <UserAvatar
            user={{ ...user, avatar_url: avatarPreview ?? user.avatar_url }}
            size="lg"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1"
          >
            <Camera className="size-3" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('clickToChangePhoto')}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">{t('displayName')}</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}

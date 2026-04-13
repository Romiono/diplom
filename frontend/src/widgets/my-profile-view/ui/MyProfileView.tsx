'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@entities/user';
import { UserAvatar } from '@entities/user';
import { StarRating } from '@entities/review';
import { EditProfileForm } from '@features/profile-edit';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { truncateAddress } from '@shared/lib/utils';

export function MyProfileView() {
  const t = useTranslations('profile');
  const { data: user } = useCurrentUser();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div>
            <h1 className="text-xl font-bold">
              {user.display_name ?? user.username ?? truncateAddress(user.wallet_address)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {truncateAddress(user.wallet_address)}
            </p>
            <StarRating value={Math.round(user.rating)} readonly size="sm" />
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          {t('editProfile')}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{Number(user.rating).toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">{t('rating')}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{user.total_sales}</p>
          <p className="text-sm text-muted-foreground">{t('sales')}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{user.total_purchases}</p>
          <p className="text-sm text-muted-foreground">{t('purchases')}</p>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editProfile')}</DialogTitle>
          </DialogHeader>
          <EditProfileForm user={user} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

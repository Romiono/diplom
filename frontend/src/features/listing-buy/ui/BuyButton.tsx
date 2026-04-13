'use client';
import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@entities/user/model/auth.store';
import { formatTON } from '@shared/lib/utils';
import { useBuyListing } from '../model/useBuyListing';

interface Props {
  listingId: string;
  price: number;
  sellerId: string;
}

export function BuyButton({ listingId, price, sellerId }: Props) {
  const t = useTranslations('listing');
  const { mutate, isPending } = useBuyListing(listingId);
  const { isAuthenticated, user } = useAuthStore();

  
  if (user?.id === sellerId) return null;
  if (!isAuthenticated) return null;

  return (
    <Button onClick={() => mutate()} disabled={isPending} size="lg" className="w-full sm:w-auto">
      <ShoppingCart className="size-4 mr-2" />
      {isPending ? 'Создание сделки...' : t('buy', { price: formatTON(price) })}
    </Button>
  );
}

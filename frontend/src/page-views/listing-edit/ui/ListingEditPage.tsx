'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthGuard } from '@shared/ui/AuthGuard';
import { EditListingForm } from '@features/listing-edit';
import { useListing } from '@entities/listing';
import { useAuthStore } from '@entities/user';

interface Props {
  id: string;
}

function EditListingContent({ id }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const { user } = useAuthStore();

  useEffect(() => {
    if (listing && user && listing.seller_id !== user.id) {
      router.replace(`/${locale}/listings/${id}`);
    }
  }, [listing, user, router, locale, id]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Редактировать объявление</h1>
      <EditListingForm
        listing={listing}
        onSuccess={() => router.push(`/${locale}/listings/${id}`)}
      />
    </div>
  );
}

export function ListingEditPage({ id }: Props) {
  return (
    <AuthGuard>
      <EditListingContent id={id} />
    </AuthGuard>
  );
}

'use client';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '@shared/ui/AuthGuard';
import { CreateListingForm } from '@features/listing-create';

export function ListingCreatePage() {
  const t = useTranslations('listing');

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{t('create')}</h1>
        <CreateListingForm />
      </div>
    </AuthGuard>
  );
}

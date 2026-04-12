'use client';
import { AuthGuard } from '@shared/ui/AuthGuard';
import { CreateListingForm } from '@features/listing-create';

export function ListingCreatePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Создать объявление</h1>
        <CreateListingForm />
      </div>
    </AuthGuard>
  );
}

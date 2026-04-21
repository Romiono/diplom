'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyListingsView } from '@widgets/my-listings-view';

export function MyListingsPage() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/profile`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{t('nav.myListings')}</h1>
        </div>
        <Button size="sm" asChild>
          <Link href={`/${locale}/listings/create`}>
            <Plus className="size-4 mr-2" />
            {t('nav.create')}
          </Link>
        </Button>
      </div>
      <MyListingsView />
    </div>
  );
}

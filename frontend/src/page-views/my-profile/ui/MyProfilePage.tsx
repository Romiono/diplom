'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyProfileView } from '@widgets/my-profile-view';

export function MyProfilePage() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('nav.profile')}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/profile/listings`}>
            <LayoutList className="size-4 mr-2" />
            {t('nav.myListings')}
          </Link>
        </Button>
      </div>
      <MyProfileView />
    </div>
  );
}

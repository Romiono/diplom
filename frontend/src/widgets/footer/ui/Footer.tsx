'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export function Footer() {
  const locale = useLocale();
  const t = useTranslations('nav');

  return (
    <footer className="border-t mt-auto py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        © 2025 TON Marketplace ·{' '}
        <Link href={`/${locale}/listings`} className="hover:underline">
          {t('listings')}
        </Link>
      </div>
    </footer>
  );
}

'use client';
import { useParams, usePathname as useNextPathname } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  // useParams is always in sync with the URL — avoids stale context from useLocale()
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ru';
  const router = useRouter();
  const rawPathname = useNextPathname(); // full path e.g. /ru/listings/123

  const toggle = () => {
    const next = locale === 'ru' ? 'en' : 'ru';
    // Strip locale segment so next-intl can add the correct one
    const pathWithoutLocale = rawPathname.replace(/^\/(ru|en)/, '') || '/';
    router.replace(pathWithoutLocale, { locale: next });
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="w-10 px-0 font-medium text-xs">
      {locale === 'ru' ? 'EN' : 'RU'}
    </Button>
  );
}

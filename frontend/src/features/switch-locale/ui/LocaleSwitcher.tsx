'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname(); // returns path WITHOUT locale prefix

  const toggle = () => {
    const next = locale === 'ru' ? 'en' : 'ru';
    router.replace(pathname, { locale: next });
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="w-10 px-0 font-medium text-xs">
      {locale === 'ru' ? 'EN' : 'RU'}
    </Button>
  );
}

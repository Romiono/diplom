'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next = locale === 'ru' ? 'en' : 'ru';
    // pathname starts with /{locale}/... — replace only the locale segment
    const newPath = (pathname ?? `/${locale}`).replace(`/${locale}`, `/${next}`);
    router.push(newPath);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="w-10 px-0 font-medium text-xs">
      {locale === 'ru' ? 'EN' : 'RU'}
    </Button>
  );
}

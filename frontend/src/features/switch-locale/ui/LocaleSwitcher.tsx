'use client';
import { useParams, usePathname as useNextPathname } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ru';
  const router = useRouter();
  const rawPathname = useNextPathname(); 

  const toggle = () => {
    const next = locale === 'ru' ? 'en' : 'ru';
    
    const pathWithoutLocale = (rawPathname ?? '/').replace(/^\/(ru|en)/, '') || '/';
    router.replace(pathWithoutLocale, { locale: next });
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="w-10 px-0 font-medium text-xs">
      {locale === 'ru' ? 'EN' : 'RU'}
    </Button>
  );
}

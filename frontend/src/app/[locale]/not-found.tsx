import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <SearchX className="size-16 text-muted-foreground" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">{t('title')}</p>
      <p className="text-sm text-muted-foreground max-w-md">{t('description')}</p>
      <Button asChild>
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </div>
  );
}

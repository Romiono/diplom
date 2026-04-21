'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle className="size-12 text-destructive" />
      <h1 className="text-2xl font-bold">{t('errorTitle')}</h1>
      <p className="text-muted-foreground max-w-md">
        {error.message || t('errorDescription')}
      </p>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </div>
  );
}

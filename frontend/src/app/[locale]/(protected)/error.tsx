'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle className="size-12 text-destructive" />
      <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
      <p className="text-muted-foreground max-w-md">
        {error.message || 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.'}
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}

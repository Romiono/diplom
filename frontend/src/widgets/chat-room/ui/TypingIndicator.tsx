'use client';
import { useTranslations } from 'next-intl';

export function TypingIndicator() {
  const t = useTranslations('message');

  return (
    <div className="text-xs text-muted-foreground animate-pulse px-2">
      {t('typing')}
    </div>
  );
}

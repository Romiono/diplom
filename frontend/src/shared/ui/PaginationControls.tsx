'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, totalPages, onPageChange }: Props) {
  const t = useTranslations('common');

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-3 justify-center mt-6">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t('prev')}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t('page', { current: page, total: totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('next')}
      </Button>
    </div>
  );
}

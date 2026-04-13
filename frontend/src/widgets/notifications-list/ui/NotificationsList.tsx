'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { useMyNotifications } from '@entities/notification';
import { NotificationItem } from '@entities/notification';
import { PaginationControls } from '@shared/ui/PaginationControls';
import { EmptyState } from '@shared/ui/EmptyState';

export function NotificationsList() {
  const t = useTranslations('notification');
  const [page, setPage] = useState(1);
  const { data } = useMyNotifications(page);

  if (!data?.data.length) {
    return <EmptyState icon={<Bell className="size-10" />} title={t('noNotifications')} />;
  }

  return (
    <div>
      {data.data.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
      <PaginationControls
        page={page}
        totalPages={data.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

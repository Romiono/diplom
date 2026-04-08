import { Bell } from 'lucide-react';
import { cn, formatRelative } from '@shared/lib/utils';
import type { EmailNotification } from '@shared/types/api';

interface Props {
  notification: EmailNotification;
}

const statusStyles: Record<EmailNotification['status'], string> = {
  pending: 'text-yellow-500',
  sent: 'text-green-500',
  failed: 'text-destructive',
};

export function NotificationItem({ notification }: Props) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-1.5 rounded-full bg-muted shrink-0">
        <Bell className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{notification.subject}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-xs font-medium', statusStyles[notification.status])}>
            {notification.status}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(notification.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

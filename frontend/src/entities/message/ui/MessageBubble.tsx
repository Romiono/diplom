import { cn, formatRelative } from '@shared/lib/utils';
import type { Message } from '@shared/types/api';

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isOwn ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground',
          )}
        >
          {formatRelative(message.created_at)}
        </p>
      </div>
    </div>
  );
}

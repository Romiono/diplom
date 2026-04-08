'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer')}
          >
            <Star
              className={cn(
                iconSize,
                filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

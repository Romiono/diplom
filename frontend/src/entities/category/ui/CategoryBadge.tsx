import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import type { Category } from '@shared/types/api';

interface Props {
  category: Category;
  asLink?: boolean;
  className?: string;
}

export function CategoryBadge({ category, asLink = false, className }: Props) {
  const classes = cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
    'bg-secondary text-secondary-foreground',
    className,
  );

  const content = (
    <>
      {category.icon && <span>{category.icon}</span>}
      <span>{category.name}</span>
    </>
  );

  if (asLink) {
    return (
      <Link href={`/?category_id=${category.id}`} className={cn(classes, 'hover:bg-secondary/80 transition-colors')}>
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}

import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { TransactionStatus } from '@shared/types/api';

interface Props {
  status: TransactionStatus;
}

type Step = { key: string; statuses: TransactionStatus[] };

const STEPS: Step[] = [
  { key: 'created',   statuses: ['pending', 'paid', 'confirmed', 'completed', 'disputed', 'refunded', 'cancelled'] },
  { key: 'paid',      statuses: ['paid', 'confirmed', 'completed', 'disputed'] },
  { key: 'confirmed', statuses: ['confirmed', 'completed'] },
  { key: 'completed', statuses: ['completed'] },
];

function isStepDone(step: Step, status: TransactionStatus) {
  return step.statuses.includes(status);
}

export function TransactionStepper({ status }: Props) {
  const t = useTranslations('transaction.steps');
  const isDisputed = status === 'disputed';
  const isCancelledOrRefunded = status === 'cancelled' || status === 'refunded';

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = isStepDone(step, status);
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'size-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors',
                  done && !isDisputed
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isDisputed && step.key === 'confirmed'
                    ? 'bg-destructive border-destructive text-destructive-foreground'
                    : isCancelledOrRefunded
                    ? 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isDisputed && step.key === 'confirmed' ? (
                  <AlertCircle className="size-4" />
                ) : done ? (
                  <Check className="size-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs whitespace-nowrap',
                  done ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {isDisputed && step.key === 'confirmed' ? t('disputed') : t(step.key)}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 transition-colors',
                  isStepDone(STEPS[i + 1], status) && !isDisputed
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

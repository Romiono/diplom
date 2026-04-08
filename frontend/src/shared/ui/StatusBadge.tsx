import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import type { ListingStatus, TransactionStatus, NotificationStatus } from '@shared/types/api';

type StatusType = ListingStatus | TransactionStatus | NotificationStatus;
type Ns = 'listing' | 'transaction' | 'notification';

const VARIANT_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  // listing
  active: 'default',
  sold: 'secondary',
  reserved: 'outline',
  removed: 'outline',
  // transaction
  pending: 'outline',
  paid: 'default',
  confirmed: 'default',
  completed: 'default',
  refunded: 'secondary',
  cancelled: 'outline',
  // shared disputed / failed
  disputed: 'destructive',
  failed: 'destructive',
  // notification
  sent: 'default',
};

interface Props {
  status: StatusType;
  ns: Ns;
}

export function StatusBadge({ status, ns }: Props) {
  const t = useTranslations(`${ns}.status`);
  return (
    <Badge variant={VARIANT_MAP[status] ?? 'outline'}>
      {t(status)}
    </Badge>
  );
}

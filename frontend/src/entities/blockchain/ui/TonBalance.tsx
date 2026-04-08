import { Loader2 } from 'lucide-react';
import { useTonBalance } from '../model/queries';

interface Props {
  address: string;
  className?: string;
}

export function TonBalance({ address, className }: Props) {
  const { data, isLoading, isError } = useTonBalance(address);

  if (isLoading) return <Loader2 className="size-3.5 animate-spin text-muted-foreground" />;
  if (isError || !data) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <span className={className}>
      {data.balanceTON} <span className="text-muted-foreground">TON</span>
    </span>
  );
}

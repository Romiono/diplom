import { ExternalLink, Loader2 } from 'lucide-react';
import { truncateAddress } from '@shared/lib/utils';
import { useEscrowState } from '../model/queries';

interface Props {
  contractAddress: string;
}

export function EscrowInfo({ contractAddress }: Props) {
  const { data, isLoading, isError } = useEscrowState(contractAddress);
  const explorerUrl = `https://testnet.tonscan.org/address/${contractAddress}`;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Escrow Contract
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {truncateAddress(contractAddress)}
          <ExternalLink className="size-3" />
        </a>
      </div>

      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Loading contract state…
        </div>
      )}

      {isError && (
        <p className="text-xs text-destructive">Failed to load contract state</p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Balance</span>
          <span className="font-medium">{(Number(data.balance) / 1e9).toFixed(4)} TON</span>
          {data.state && (
            <>
              <span className="text-muted-foreground">State</span>
              <span className="font-medium capitalize">{String(data.state)}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

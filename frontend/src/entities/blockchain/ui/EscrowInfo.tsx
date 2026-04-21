'use client';
import { useTranslations } from 'next-intl';
import { ExternalLink, Loader2 } from 'lucide-react';
import { truncateAddress } from '@shared/lib/utils';
import { useEscrowState } from '../model/queries';

interface Props {
  contractAddress: string;
}

export function EscrowInfo({ contractAddress }: Props) {
  const t = useTranslations('escrow');
  const { data, isLoading, isError } = useEscrowState(contractAddress);
  const explorerUrl = `https://testnet.tonscan.org/address/${contractAddress}`;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('contract')}
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
          {t('loading')}
        </div>
      )}

      {isError && (
        <p className="text-xs text-destructive">{t('error')}</p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">{t('balance')}</span>
          <span className="font-medium">{Number(data.amount).toFixed(4)} TON</span>
          {data.status && (
            <>
              <span className="text-muted-foreground">{t('state')}</span>
              <span className="font-medium capitalize">{String(data.status)}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

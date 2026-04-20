'use client';
import { Loader2, LogOut, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import { useAuthStore } from '@entities/user/model/auth.store';
import { truncateAddress } from '@shared/lib/utils';
import { useAuthByTon } from '../model/useAuthByTon';

export function ConnectButton() {
  const t = useTranslations('auth');
  const { connect, disconnect, isPending } = useAuthByTon();
  const { isAuthenticated, user } = useAuthStore();

  if (isPending) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="size-4 animate-spin mr-2" />
        {t('signing')}
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" onClick={connect}>
        <Wallet className="size-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('connectWallet')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <UserAvatar
            user={{ display_name: user.displayName, username: user.username, avatar_url: null }}
            size="sm"
          />
          <span className="hidden sm:inline text-xs">
            {user.displayName ?? user.username ?? truncateAddress(user.walletAddress)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          {truncateAddress(user.walletAddress)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="size-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

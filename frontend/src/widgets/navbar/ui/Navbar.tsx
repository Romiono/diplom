'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@entities/user/model/auth.store';
import { ConnectButton } from '@features/auth-by-ton';
import { ThemeToggle } from '@features/toggle-theme';
import { LocaleSwitcher } from '@features/switch-locale';
import { Bell, Menu, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();

  const navLinks = (
    <>
      <Link href={`/${locale}`}>{t('home')}</Link>
      <Link href={`/${locale}/listings`}>{t('listings')}</Link>
      {isAuthenticated && (
        <>
          <Link href={`/${locale}/messages`}>{t('messages')}</Link>
          <Link href={`/${locale}/transactions`}>{t('transactions')}</Link>
        </>
      )}
    </>
  );

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="font-bold text-lg">
          TON Market
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
                <Link href={`/${locale}/profile`}>
                  <User className="size-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
                <Link href={`/${locale}/notifications`}>
                  <Bell className="size-4" />
                </Link>
              </Button>
              <Button size="sm" asChild className="hidden md:inline-flex">
                <Link href={`/${locale}/listings/create`}>
                  <Plus className="size-4 mr-1" />
                  {t('create')}
                </Link>
              </Button>
            </>
          )}
          <ConnectButton />

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>TON Market</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 px-4 pt-4 text-sm">
                <SheetClose asChild>
                  <Link href={`/${locale}`}>{t('home')}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href={`/${locale}/listings`}>{t('listings')}</Link>
                </SheetClose>
                {isAuthenticated && (
                  <>
                    <SheetClose asChild>
                      <Link href={`/${locale}/messages`}>{t('messages')}</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={`/${locale}/transactions`}>{t('transactions')}</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={`/${locale}/profile`}>{t('profile')}</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={`/${locale}/notifications`}>{t('notifications')}</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href={`/${locale}/listings/create`}
                        className="flex items-center gap-1"
                      >
                        <Plus className="size-4" />
                        {t('create')}
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

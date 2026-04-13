'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    
    try {
      const raw = localStorage.getItem('ton-marketplace-auth');
      const isAuthenticated = raw
        ? (JSON.parse(raw) as { state?: { isAuthenticated?: boolean } })?.state?.isAuthenticated ?? false
        : false;

      if (!isAuthenticated) {
        router.replace(`/?redirect=${encodeURIComponent(pathname ?? '/')}`);
      }
    } catch {
      router.replace('/');
    }
  }, [router, pathname]);

  return <>{children}</>;
}

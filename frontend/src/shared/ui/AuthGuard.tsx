'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Lazy import чтобы избежать SSR-проблем с Zustand persist.
 * Используем динамический импорт внутри useEffect.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Читаем auth state напрямую из localStorage (не через store на сервере)
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

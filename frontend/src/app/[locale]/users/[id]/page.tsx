import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { UserProfilePage } from '@pages/user-profile/ui/UserProfilePage';
import { env } from '@shared/config/env';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const user = await fetch(`${env.apiUrl}/users/${id}`, {
      next: { revalidate: 60 },
    }).then((r) => (r.ok ? r.json() : null));

    if (user) {
      const name = user.display_name ?? user.username ?? user.wallet_address?.slice(0, 10);
      return { title: `${name} — TON Market` };
    }
  } catch {
    // fall through to default
  }
  return { title: 'Профиль пользователя — TON Market' };
}

export default async function Page({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  return <UserProfilePage id={id} />;
}

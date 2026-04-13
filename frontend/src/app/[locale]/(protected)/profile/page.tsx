import { setRequestLocale } from 'next-intl/server';
import { MyProfilePage } from '@pages/my-profile/ui/MyProfilePage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MyProfilePage />;
}

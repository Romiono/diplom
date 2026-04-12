import { ListingEditPage } from '@pages/listing-edit/ui/ListingEditPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingEditPage id={id} />;
}

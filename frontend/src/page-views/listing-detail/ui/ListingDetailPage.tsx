import { ListingDetailView } from '@widgets/listing-detail-view';

interface Props {
  id: string;
}

export function ListingDetailPage({ id }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ListingDetailView listingId={id} />
    </div>
  );
}

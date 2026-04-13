'use client';
import { useUser, UserAvatar } from '@entities/user';
import { useUserListings, ListingGrid } from '@entities/listing';
import { useUserReviews, StarRating, ReviewCard } from '@entities/review';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { truncateAddress } from '@shared/lib/utils';

interface Props {
  userId: string;
}

export function UserProfileView({ userId }: Props) {
  const { data: user } = useUser(userId);
  const { data: listings } = useUserListings(userId);
  const { data: reviews } = useUserReviews(userId);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <div>
          <h1 className="text-xl font-bold">
            {user.display_name ?? user.username ?? truncateAddress(user.wallet_address)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {truncateAddress(user.wallet_address)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={Math.round(Number(user.rating))} readonly size="sm" />
            <span className="text-sm text-muted-foreground">
              {Number(user.rating).toFixed(1)} · {user.total_sales} продаж
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">
            Объявления ({listings?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Отзывы ({reviews?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-4">
          <ListingGrid listings={listings?.data ?? []} isLoading={!listings} />
        </TabsContent>
        <TabsContent value="reviews" className="mt-4 space-y-3">
          {reviews?.map((r) => <ReviewCard key={r.id} review={r} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

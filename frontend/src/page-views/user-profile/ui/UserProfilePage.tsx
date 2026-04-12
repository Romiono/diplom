import { UserProfileView } from '@widgets/user-profile-view';

interface Props {
  id: string;
}

export function UserProfilePage({ id }: Props) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <UserProfileView userId={id} />
    </div>
  );
}

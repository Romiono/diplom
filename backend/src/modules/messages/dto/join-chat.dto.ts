import { IsUUID } from 'class-validator';

export class JoinChatDto {
  @IsUUID()
  listingId: string;
}

import { IsUUID } from 'class-validator';

export class TypingDto {
  @IsUUID()
  listingId: string;
}

import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  listing_id: string;

  @IsUUID()
  receiver_id: string;

  @IsString()
  @MinLength(1)
  content: string;
}

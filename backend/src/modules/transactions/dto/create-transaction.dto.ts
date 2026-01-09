import { IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  listing_id: string;
}

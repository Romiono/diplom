import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
const sanitizeHtml: (dirty: string, options?: object) => string =
  require('sanitize-html');

const stripHtml = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    : value;

export class CreateMessageDto {
  @IsUUID()
  listing_id: string;

  @IsUUID()
  receiver_id: string;

  @Transform(stripHtml)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

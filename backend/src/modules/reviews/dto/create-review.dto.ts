import { IsString, IsInt, Min, Max, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const sanitizeHtml: (dirty: string, options?: object) => string = require('sanitize-html');
const stripHtml = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    : value;

export class CreateReviewDto {
  @IsUUID()
  transaction_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(stripHtml)
  comment?: string;
}

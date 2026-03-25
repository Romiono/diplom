import { IsString, IsOptional, IsInt, MaxLength, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const sanitizeHtml: (dirty: string, options?: object) => string = require('sanitize-html');
const stripHtml = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    : value;

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(stripHtml)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(stripHtml)
  description?: string;

  @IsOptional()
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

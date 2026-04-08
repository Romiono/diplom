import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  MaxLength,
  IsInt,
  Min,
  IsNotEmpty,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ListingCondition } from '../entities/listing.entity';
const sanitizeHtml: (dirty: string, options?: object) => string =
  require('sanitize-html');

const stripHtml = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    : value;

export class CreateListingDto {
  @Transform(stripHtml)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Transform(stripHtml)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsNumber()
  @Min(0.01)
  price: number;

  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @Transform(stripHtml)
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  @ArrayMaxSize(10)
  image_urls?: string[];
}

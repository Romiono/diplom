import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingCondition } from '../entities/listing.entity';

const ALLOWED_SORT_FIELDS = ['created_at', 'price', 'views_count'] as const;
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'] as const;

export class SearchListingDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS, { message: 'sortBy must be one of: created_at, price, views_count' })
  sortBy?: (typeof ALLOWED_SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(ALLOWED_SORT_ORDERS, { message: 'sortOrder must be ASC or DESC' })
  sortOrder?: (typeof ALLOWED_SORT_ORDERS)[number];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

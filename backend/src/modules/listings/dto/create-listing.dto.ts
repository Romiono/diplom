import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ListingCondition } from '../entities/listing.entity';

export class CreateListingDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;
}

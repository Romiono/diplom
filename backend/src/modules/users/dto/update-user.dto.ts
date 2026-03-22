import { IsString, IsEmail, IsOptional, MaxLength, IsUrl, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
const sanitizeHtml: (dirty: string, options?: object) => string = require('sanitize-html');

const stripHtml = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : value;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Transform(stripHtml)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(stripHtml)
  display_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  avatar_url?: string;
}

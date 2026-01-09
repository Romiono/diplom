import { IsString, MinLength } from 'class-validator';

export class OpenDisputeDto {
  @IsString()
  @MinLength(10)
  reason: string;
}

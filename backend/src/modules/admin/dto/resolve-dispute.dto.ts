import { IsEnum, IsString, MinLength } from 'class-validator';

export enum DisputeResolution {
  REFUND_BUYER = 'refund_buyer',
  RELEASE_SELLER = 'release_seller',
}

export class ResolveDisputeDto {
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @IsString()
  @MinLength(10)
  comment: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class TonAuthDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  payload: string;
}

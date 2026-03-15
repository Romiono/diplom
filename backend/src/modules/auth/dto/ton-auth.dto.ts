import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class TonAuthDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[UE]Q[A-Za-z0-9_-]{46}$/, {
    message: 'Invalid TON wallet address format',
  })
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-fA-F]{64}$/, {
    message: 'publicKey must be a 64-character hex string (32 bytes)',
  })
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  payload: string;
}

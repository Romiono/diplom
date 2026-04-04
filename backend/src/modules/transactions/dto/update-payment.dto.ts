import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class UpdatePaymentDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsInt()
  @Min(0)
  blockNumber: number;
}

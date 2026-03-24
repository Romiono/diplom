import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TonAuthDto } from './dto/ton-auth.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { signVerify } from '@ton/crypto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async authenticateWithTon(tonAuthDto: TonAuthDto) {
    const { walletAddress, publicKey, signature, payload } = tonAuthDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.auth_nonce')
      .where('user.wallet_address = :walletAddress', { walletAddress })
      .getOne();

    if (!user || !user.auth_nonce) {
      throw new UnauthorizedException(
        'No active nonce found. Please request a nonce first via GET /auth/nonce',
      );
    }

    if (user.auth_nonce !== payload) {
      throw new UnauthorizedException(
        'Nonce mismatch. Please request a new nonce.',
      );
    }

    const isValidSignature = this.verifyTonSignature(
      walletAddress,
      publicKey,
      signature,
      payload,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    user.auth_nonce = null;
    await this.userRepository.save(user);

    const jwtPayload: JwtPayloadDto = {
      sub: user.id,
      walletAddress: user.wallet_address,
      isAdmin: user.is_admin,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    return {
      accessToken,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        displayName: user.display_name,
        isAdmin: user.is_admin,
      },
    };
  }

  private verifyTonSignature(
    walletAddress: string,
    publicKey: string,
    signature: string,
    nonce: string,
  ): boolean {
    try {
      const message = Buffer.from(`ton-auth:${walletAddress}:${nonce}`);
      const signatureBytes = Buffer.from(signature, 'base64');
      const publicKeyBytes = Buffer.from(publicKey, 'hex');

      if (signatureBytes.length !== 64 || publicKeyBytes.length !== 32) {
        return false;
      }

      return signVerify(message, signatureBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  async generateNonce(walletAddress: string): Promise<string> {
    const TON_ADDRESS_RE = /^[0-9A-Za-z_+-]{48}$|^-?[0-9]:[0-9a-fA-F]{64}$/;
    if (!TON_ADDRESS_RE.test(walletAddress)) {
      throw new BadRequestException('Invalid TON wallet address format');
    }

    const nonce = crypto.randomBytes(32).toString('hex');

    let user = await this.userRepository.findOne({
      where: { wallet_address: walletAddress },
    });

    if (!user) {
      user = this.userRepository.create({
        wallet_address: walletAddress,
        display_name: `User ${walletAddress.slice(0, 6)}`,
      });
    }

    user.auth_nonce = nonce;
    await this.userRepository.save(user);

    return nonce;
  }
}

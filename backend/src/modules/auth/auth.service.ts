import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    // 1. Find user — must exist (nonce was pre-generated via /auth/nonce)
    const user = await this.userRepository.findOne({
      where: { wallet_address: walletAddress },
    });

    if (!user || !user.auth_nonce) {
      throw new UnauthorizedException(
        'No active nonce found. Please request a nonce first via GET /auth/nonce',
      );
    }

    // 2. Verify nonce: payload must match stored nonce exactly
    if (user.auth_nonce !== payload) {
      throw new UnauthorizedException(
        'Nonce mismatch. Please request a new nonce.',
      );
    }

    // 3. Verify Ed25519 signature over the signed message
    const isValidSignature = this.verifyTonSignature(
      walletAddress,
      publicKey,
      signature,
      payload,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 4. Invalidate nonce immediately (single-use)
    user.auth_nonce = null;
    await this.userRepository.save(user);

    // 5. Issue JWT
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
      // Signed message: "ton-auth:<walletAddress>:<nonce>"
      // This format binds the signature to a specific address and nonce,
      // preventing cross-address and replay attacks.
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
    const nonce = crypto.randomBytes(32).toString('hex');

    // Upsert: create user record if not exists, then save nonce.
    // This ensures nonce is always persisted for both new and existing users.
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

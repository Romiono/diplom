import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TonAuthDto } from './dto/ton-auth.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async authenticateWithTon(tonAuthDto: TonAuthDto) {
    const { walletAddress, signature, payload } = tonAuthDto;

    // Verify signature (simplified for MVP)
    // In production, use proper TON signature verification with tonweb or @ton/crypto
    const isValidSignature = await this.verifyTonSignature(
      walletAddress,
      signature,
      payload,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { wallet_address: walletAddress },
    });

    if (!user) {
      user = this.userRepository.create({
        wallet_address: walletAddress,
        display_name: `User ${walletAddress.slice(0, 6)}`,
      });
      await this.userRepository.save(user);
    }

    // Generate JWT token
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

  private async verifyTonSignature(
    walletAddress: string,
    signature: string,
    payload: string,
  ): Promise<boolean> {
    // MVP: Basic verification
    // TODO: Implement proper TON signature verification
    // This should verify that the signature was created by the private key
    // corresponding to the walletAddress using TON crypto libraries

    // For now, we'll do a simple check
    // In production, use: TonConnect SDK verification or @ton/crypto

    try {
      // Placeholder verification
      // Real implementation would:
      // 1. Parse the signature
      // 2. Recover the public key from signature
      // 3. Verify it matches the wallet address
      // 4. Verify the payload was signed

      // For MVP, we'll accept if all fields are present and non-empty
      return (
        walletAddress &&
        signature &&
        payload &&
        walletAddress.length > 0 &&
        signature.length > 0 &&
        payload.length > 0
      );
    } catch (error) {
      return false;
    }
  }

  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');

    // Save nonce to user or cache
    const user = await this.userRepository.findOne({
      where: { wallet_address: walletAddress },
    });

    if (user) {
      user.auth_nonce = nonce;
      await this.userRepository.save(user);
    }

    return nonce;
  }
}

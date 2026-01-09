import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    return this.userRepository.findOne({
      where: { wallet_address: walletAddress },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check username uniqueness if provided
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    // Check email uniqueness if provided
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async getProfile(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'wallet_address',
        'username',
        'display_name',
        'email',
        'avatar_url',
        'rating',
        'total_sales',
        'total_purchases',
        'created_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRating(userId: string): Promise<void> {
    // Calculate average rating from reviews
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.reviews_received', 'review')
      .select('AVG(review.rating)', 'avgRating')
      .where('user.id = :userId', { userId })
      .getRawOne();

    const avgRating = result.avgRating ? parseFloat(result.avgRating) : 0;

    await this.userRepository.update(userId, {
      rating: avgRating,
    });
  }

  async incrementSalesCount(userId: string): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'total_sales', 1);
  }

  async incrementPurchasesCount(userId: string): Promise<void> {
    await this.userRepository.increment(
      { id: userId },
      'total_purchases',
      1,
    );
  }
}

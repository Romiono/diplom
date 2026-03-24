import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async create(senderId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    if (senderId === createMessageDto.receiver_id) {
      throw new BadRequestException('Cannot send a message to yourself');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      sender_id: senderId,
    });

    return this.messageRepository.save(message);
  }

  async getListingMessages(listingId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { listing_id: listingId },
      relations: ['sender', 'receiver'],
      order: { created_at: 'ASC' },
    });
  }

  async getListingHistory(
    listingId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Message>> {
    const participantCheck = await this.messageRepository.findOne({
      where: [
        { listing_id: listingId, sender_id: userId },
        { listing_id: listingId, receiver_id: userId },
      ],
    });

    if (!participantCheck) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const skip = (page - 1) * limit;
    const [data, total] = await this.messageRepository.findAndCount({
      where: { listing_id: listingId },
      select: ['id', 'sender_id', 'receiver_id', 'content', 'is_read', 'created_at'],
      order: { created_at: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, { is_read: true });
  }

  async getUserChats(userId: string): Promise<any[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.listing', 'listing')
      .where('message.sender_id = :userId OR message.receiver_id = :userId', {
        userId,
      })
      .orderBy('message.created_at', 'DESC')
      .getMany();

    const chatsMap = new Map();
    for (const message of messages) {
      if (!chatsMap.has(message.listing_id)) {
        chatsMap.set(message.listing_id, {
          listing: message.listing,
          lastMessage: message,
        });
      }
    }

    return Array.from(chatsMap.values());
  }
}

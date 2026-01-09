import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async create(senderId: string, createMessageDto: CreateMessageDto): Promise<Message> {
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

  async markAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, { is_read: true });
  }

  async getUserChats(userId: string): Promise<any[]> {
    // Get unique listings where user has messages
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.listing', 'listing')
      .where('message.sender_id = :userId OR message.receiver_id = :userId', {
        userId,
      })
      .orderBy('message.created_at', 'DESC')
      .getMany();

    // Group by listing
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

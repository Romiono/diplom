import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('messages')
@Index(['listing_id', 'created_at'])
@Index(['receiver_id', 'is_read', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  listing_id: string;

  @Column({ type: 'uuid', nullable: false })
  sender_id: string;

  @Column({ type: 'uuid', nullable: false })
  receiver_id: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Listing, (listing) => listing.messages)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, (user) => user.sent_messages)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, (user) => user.received_messages)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}

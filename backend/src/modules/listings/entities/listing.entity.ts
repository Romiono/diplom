import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { ListingImage } from './listing-image.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Message } from '../../messages/entities/message.entity';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RESERVED = 'reserved',
  REMOVED = 'removed',
  DISPUTED = 'disputed',
}

export enum ListingCondition {
  NEW = 'new',
  USED = 'used',
  REFURBISHED = 'refurbished',
}

@Entity('listings')
@Index(['seller_id', 'status'])
@Index(['category_id', 'status'])
@Index(['status'])
@Index(['price'])
@Index(['created_at'])
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  seller_id: string;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'TON' })
  currency: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  condition: ListingCondition;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;

  @Column({ type: 'int', default: 0 })
  views_count: number;

  @Column({ type: 'tsvector', nullable: true, select: false })
  search_vector: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sold_at: Date;

  @ManyToOne(() => User, (user) => user.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Category, (category) => category.listings)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ListingImage, (image) => image.listing, { cascade: true })
  images: ListingImage[];

  @OneToMany(() => Transaction, (transaction) => transaction.listing)
  transactions: Transaction[];

  @OneToMany(() => Message, (message) => message.listing)
  messages: Message[];
}

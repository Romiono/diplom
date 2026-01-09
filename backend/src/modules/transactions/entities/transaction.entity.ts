import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Listing } from '../../listings/entities/listing.entity';
import { Review } from '../../reviews/entities/review.entity';
import { TransactionHistory } from './transaction-history.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CONFIRMED = 'confirmed',
  DISPUTED = 'disputed',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
@Index(['buyer_id', 'status'])
@Index(['seller_id', 'status'])
@Index(['listing_id'])
@Index(['status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  listing_id: string;

  @Column({ type: 'uuid', nullable: false })
  buyer_id: string;

  @Column({ type: 'uuid', nullable: false })
  seller_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  amount: number;

  // Blockchain data
  @Column({ type: 'varchar', length: 48, nullable: true })
  escrow_contract_address: string;

  @Column({ type: 'varchar', length: 44, nullable: true })
  tx_hash: string;

  @Column({ type: 'bigint', nullable: true })
  block_number: number;

  // Status and timestamps
  @Column({
    type: 'varchar',
    length: 20,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  // Dispute handling
  @Column({ type: 'text', nullable: true })
  dispute_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  dispute_opened_at: Date;

  @Column({ type: 'uuid', nullable: true })
  dispute_resolved_by: string;

  @Column({ type: 'text', nullable: true })
  dispute_resolution: string;

  @Column({ type: 'timestamp', nullable: true })
  dispute_resolved_at: Date;

  // Relations
  @ManyToOne(() => Listing, (listing) => listing.transactions)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @ManyToOne(() => User, (user) => user.sales)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'dispute_resolved_by' })
  dispute_resolver: User;

  @OneToMany(() => Review, (review) => review.transaction)
  reviews: Review[];

  @OneToMany(() => TransactionHistory, (history) => history.transaction)
  history: TransactionHistory[];
}

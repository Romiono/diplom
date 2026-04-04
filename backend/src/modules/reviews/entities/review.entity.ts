import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Unique(['transaction_id', 'reviewer_id'])
@Index(['reviewee_id', 'created_at'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  transaction_id: string;

  @Column({ type: 'uuid', nullable: false })
  reviewer_id: string;

  @Column({ type: 'uuid', nullable: false })
  reviewee_id: string;

  @Column({ type: 'int', nullable: false })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Transaction, (transaction) => transaction.reviews)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @ManyToOne(() => User, (user) => user.reviews_given)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ManyToOne(() => User, (user) => user.reviews_received)
  @JoinColumn({ name: 'reviewee_id' })
  reviewee: User;
}

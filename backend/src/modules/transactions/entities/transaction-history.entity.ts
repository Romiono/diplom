import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from '../../users/entities/user.entity';

@Entity('transaction_history')
@Index(['transaction_id', 'created_at'])
export class TransactionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  transaction_id: string;

  @Column({ type: 'uuid', nullable: true })
  changed_by: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  old_status: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  new_status: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Transaction, (transaction) => transaction.history)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  user: User;
}

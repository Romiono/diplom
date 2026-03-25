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

export enum AdminActionType {
  RESOLVE_DISPUTE = 'resolve_dispute',
  BAN_USER = 'ban_user',
  REMOVE_LISTING = 'remove_listing',
  UNBAN_USER = 'unban_user',
}

@Entity('admin_actions')
@Index(['admin_id', 'created_at'])
@Index(['action_type', 'created_at'])
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  admin_id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  action_type: AdminActionType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target_type: string;

  @Column({ type: 'uuid', nullable: true })
  target_id: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;
}

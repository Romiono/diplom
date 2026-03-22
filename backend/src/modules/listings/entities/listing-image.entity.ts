import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('listing_images')
@Index(['listing_id', 'order_index'])
export class ListingImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  listing_id: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  image_url: string;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mime_type: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Listing, (listing) => listing.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}

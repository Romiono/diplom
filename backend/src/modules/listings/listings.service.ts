import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Listing, ListingStatus } from './entities/listing.entity';
import { ListingImage } from './entities/listing-image.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private listingImageRepository: Repository<ListingImage>,
  ) {}

  async create(
    sellerId: string,
    createListingDto: CreateListingDto,
  ): Promise<Listing> {
    const listing = this.listingRepository.create({
      ...createListingDto,
      seller_id: sellerId,
      status: ListingStatus.ACTIVE,
    });

    return this.listingRepository.save(listing);
  }

  async search(
    searchDto: SearchListingDto,
  ): Promise<PaginatedResult<Listing>> {
    const {
      query,
      category_id,
      minPrice,
      maxPrice,
      condition,
      location,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = searchDto;

    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE });

    // Full-text search
    if (query) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('listing.title ILIKE :query', {
            query: `%${query}%`,
          }).orWhere('listing.description ILIKE :query', {
            query: `%${query}%`,
          });
        }),
      );
    }

    // Category filter
    if (category_id) {
      queryBuilder.andWhere('listing.category_id = :category_id', {
        category_id,
      });
    }

    // Price range
    if (minPrice !== undefined) {
      queryBuilder.andWhere('listing.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('listing.price <= :maxPrice', { maxPrice });
    }

    // Condition filter
    if (condition) {
      queryBuilder.andWhere('listing.condition = :condition', { condition });
    }

    // Location filter
    if (location) {
      queryBuilder.andWhere('listing.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    // Sorting
    queryBuilder.orderBy(`listing.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'images', 'category'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment views
    await this.listingRepository.increment({ id }, 'views_count', 1);

    return listing;
  }

  async update(
    id: string,
    sellerId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<Listing> {
    const listing = await this.findOne(id);

    if (listing.seller_id !== sellerId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new ForbiddenException('Cannot update non-active listing');
    }

    Object.assign(listing, updateListingDto);
    return this.listingRepository.save(listing);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const listing = await this.findOne(id);

    if (listing.seller_id !== sellerId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    listing.status = ListingStatus.REMOVED;
    await this.listingRepository.save(listing);
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return this.listingRepository.find({
      where: { seller_id: userId },
      relations: ['images', 'category'],
      order: { created_at: 'DESC' },
    });
  }

  async reserveListing(id: string): Promise<boolean> {
    const result = await this.listingRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: ListingStatus.RESERVED })
      .where('id = :id AND status = :status', {
        id,
        status: ListingStatus.ACTIVE,
      })
      .execute();
    return result.affected > 0;
  }

  async unreserveListing(id: string): Promise<void> {
    await this.listingRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: ListingStatus.ACTIVE })
      .where('id = :id AND status = :status', {
        id,
        status: ListingStatus.RESERVED,
      })
      .execute();
  }

  async markAsSold(id: string): Promise<void> {
    await this.listingRepository.update(id, {
      status: ListingStatus.SOLD,
      sold_at: new Date(),
    });
  }

  async markAsDisputed(id: string): Promise<void> {
    await this.listingRepository.update(id, {
      status: ListingStatus.DISPUTED,
    });
  }

  async addImage(
    listingId: string,
    imageUrl: string,
    isPrimary: boolean = false,
  ): Promise<ListingImage> {
    const listing = await this.findOne(listingId);

    // Count existing images
    const imageCount = await this.listingImageRepository.count({
      where: { listing_id: listingId },
    });

    if (imageCount >= 10) {
      throw new ForbiddenException('Maximum 10 images per listing');
    }

    const image = this.listingImageRepository.create({
      listing_id: listingId,
      image_url: imageUrl,
      order_index: imageCount,
      is_primary: isPrimary || imageCount === 0,
    });

    return this.listingImageRepository.save(image);
  }

  async removeImage(imageId: string, sellerId: string): Promise<void> {
    const image = await this.listingImageRepository.findOne({
      where: { id: imageId },
      relations: ['listing'],
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.listing.seller_id !== sellerId) {
      throw new ForbiddenException('You can only delete your own images');
    }

    await this.listingImageRepository.remove(image);
  }
}

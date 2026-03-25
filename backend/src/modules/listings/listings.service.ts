import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Listing, ListingStatus } from './entities/listing.entity';
import { ListingImage } from './entities/listing-image.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

const PUBLIC_VISIBLE_STATUSES = [ListingStatus.ACTIVE, ListingStatus.SOLD];

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private listingImageRepository: Repository<ListingImage>,
  ) {}

  private async findListing(id: string): Promise<Listing> {
    const listing = await this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoin('listing.seller', 'seller')
      .addSelect([
        'seller.id',
        'seller.wallet_address',
        'seller.username',
        'seller.display_name',
        'seller.avatar_url',
        'seller.rating',
        'seller.total_sales',
        'seller.created_at',
      ])
      .where('listing.id = :id', { id })
      .getOne();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

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

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoin('listing.seller', 'seller')
      .addSelect([
        'seller.id',
        'seller.wallet_address',
        'seller.username',
        'seller.display_name',
        'seller.avatar_url',
        'seller.rating',
        'seller.total_sales',
        'seller.created_at',
      ])
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE });

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

    if (category_id) {
      queryBuilder.andWhere('listing.category_id = :category_id', {
        category_id,
      });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('listing.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('listing.price <= :maxPrice', { maxPrice });
    }

    if (condition) {
      queryBuilder.andWhere('listing.condition = :condition', { condition });
    }

    if (location) {
      queryBuilder.andWhere('listing.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    queryBuilder.orderBy(`listing.${sortBy}`, sortOrder);

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
    const listing = await this.findListing(id);
    await this.listingRepository.increment({ id }, 'views_count', 1);
    return listing;
  }

  async update(
    id: string,
    sellerId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<Listing> {
    const listing = await this.findListing(id);

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
    const listing = await this.findListing(id);

    if (listing.seller_id !== sellerId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new ForbiddenException(
        'Cannot remove a listing that is not active',
      );
    }

    listing.status = ListingStatus.REMOVED;
    await this.listingRepository.save(listing);
  }

  async getUserListings(
    userId: string,
    requestingUserId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Listing>> {
    const isOwner = userId === requestingUserId;
    const statusFilter = isOwner
      ? undefined
      : In(PUBLIC_VISIBLE_STATUSES);

    const skip = (page - 1) * limit;

    const [data, total] = await this.listingRepository.findAndCount({
      where: {
        seller_id: userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      relations: ['images', 'category'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    await this.listingRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: ListingStatus.SOLD, sold_at: new Date() })
      .where('id = :id AND status = :status', {
        id,
        status: ListingStatus.RESERVED,
      })
      .execute();
  }

  async markAsDisputed(id: string): Promise<void> {
    await this.listingRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: ListingStatus.DISPUTED })
      .where('id = :id AND status = :status', {
        id,
        status: ListingStatus.RESERVED,
      })
      .execute();
  }

  async addImage(
    listingId: string,
    imageUrl: string,
    isPrimary: boolean = false,
  ): Promise<ListingImage> {
    const listing = await this.findListing(listingId);

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

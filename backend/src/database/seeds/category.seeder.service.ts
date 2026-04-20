import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';

const CATEGORIES = [
  {
    name: 'Цифровое искусство',
    slug: 'digital-art',
    description: 'NFT, иллюстрации, генеративное искусство',
    icon: '🎨',
  },
  {
    name: 'Музыка',
    slug: 'music',
    description: 'Треки, альбомы, права на музыкальные произведения',
    icon: '🎵',
  },
  {
    name: 'Игровые предметы',
    slug: 'gaming',
    description: 'Персонажи, скины, игровые активы',
    icon: '🎮',
  },
  {
    name: 'Коллекционные предметы',
    slug: 'collectibles',
    description: 'Редкие карточки, фигурки, ограниченные серии',
    icon: '🏆',
  },
  {
    name: 'Фотография',
    slug: 'photography',
    description: 'Уникальные фотографии и фотосерии',
    icon: '📷',
  },
  {
    name: 'Видео',
    slug: 'video',
    description: 'Видеоклипы, анимации, короткометражки',
    icon: '🎬',
  },
  {
    name: 'Доменные имена',
    slug: 'domain-names',
    description: 'Блокчейн-домены и цифровые идентификаторы',
    icon: '🌐',
  },
  {
    name: 'Виртуальные миры',
    slug: 'virtual-worlds',
    description: 'Земельные участки и активы метавселенной',
    icon: '🌍',
  },
  {
    name: 'Мода',
    slug: 'fashion',
    description: 'Цифровая одежда, аксессуары, аватары',
    icon: '👗',
  },
  {
    name: 'Спорт',
    slug: 'sports',
    description: 'Спортивные моменты, карточки, сувениры',
    icon: '⚽',
  },
];

@Injectable()
export class CategorySeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategorySeederService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.categoryRepository.count();
    if (count > 0) return;

    this.logger.log('Seeding categories...');
    await this.categoryRepository.save(
      CATEGORIES.map((c) => this.categoryRepository.create(c)),
    );
    this.logger.log(`Seeded ${CATEGORIES.length} categories.`);
  }
}

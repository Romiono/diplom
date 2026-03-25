import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    try {
      return await this.categoryRepository.save(category);
    } catch (err) {
      if (err?.code === '23505') {
        throw new ConflictException('Category with this slug already exists');
      }
      throw err;
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { is_active: true },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async getCategoryTree(): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: { is_active: true, parent_id: null },
      relations: ['children'],
      order: { name: 'ASC' },
    });

    return categories;
  }

  async update(
    id: number,
    updateCategoryDto: Partial<CreateCategoryDto>,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    try {
      return await this.categoryRepository.save(category);
    } catch (err) {
      if (err?.code === '23505') {
        throw new ConflictException('Category with this slug already exists');
      }
      throw err;
    }
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    category.is_active = false;
    await this.categoryRepository.save(category);
  }
}

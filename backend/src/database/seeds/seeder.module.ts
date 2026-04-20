import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../modules/categories/entities/category.entity';
import { CategorySeederService } from './category.seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategorySeederService],
})
export class SeederModule {}

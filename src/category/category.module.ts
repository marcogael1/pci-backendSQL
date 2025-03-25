import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../schemas/category.schema';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Subcategory } from '../schemas/subcategory.schema';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Subcategory])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}

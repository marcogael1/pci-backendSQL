import { Controller, Get, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from '../schemas/category.schema';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

    @Get(':id/subcategories')
    async getSubcategories(@Param('id') categoryId: number) {
      return this.categoryService.findSubcategoriesByCategoryId(categoryId);
    }
}

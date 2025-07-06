import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../schemas/category.schema';
import { Subcategory } from 'src/schemas/subcategory.schema';
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async findSubcategoriesByCategoryId(categoryId: number) {
    return this.subcategoryRepository.find({
      where: { category: { id: categoryId } },
    });
  }
}

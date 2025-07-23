import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../schemas/category.schema';
import { Subcategory } from '../../schemas/subcategory.schema';
import { Filter } from '../../schemas/filters.schema';
import { IsString } from 'class-validator';
import { SubcategoryFilter } from 'src/schemas/subcategory_filters.schema';
import { ProductFilter } from 'src/schemas/productFilters.schema';

export class UpdateFilterDto {
  @IsString()
  name: string;

  @IsString()
  type: string;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepo: Repository<Subcategory>,
    @InjectRepository(Filter)
    private filterRepo: Repository<Filter>,
    @InjectRepository(SubcategoryFilter)
    private subcategoryFiltersRepository: Repository<SubcategoryFilter>,
    @InjectRepository(ProductFilter)
    private productFiltersRepository: Repository<ProductFilter>,
  ) { }

  async getAllCatalogData() {
    const categories = await this.categoryRepo.find({ relations: ['subcategories'] });
    const subcategories = await this.subcategoryRepo.find({ relations: ['category', 'filters'] });
    const filters = await this.filterRepo.find();

    return {
      categories,
      subcategories: subcategories.map((sub) => ({
        ...sub,
        category_name: sub.category?.name ?? '',
      })),
      filters,
      subcategoryFilters: subcategories.flatMap((sub) =>
        sub.filters.map((filter) => ({
          subcategory_id: sub.id,
          filter_id: filter.id,
        })),
      ),
    };
  }

  async createCategory(name: string) {
    const category = this.categoryRepo.create({ name });
    return await this.categoryRepo.save(category);
  }

  async createSubcategory(name: string, categoryId: number, image: string) {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const subcategory = this.subcategoryRepo.create({
      name,
      image,
      category,
    });

    return await this.subcategoryRepo.save(subcategory);
  }

  async linkFiltersToSubcategory(subcategoryId: number, filterIds: number[]) {
    const subcategory = await this.subcategoryRepo.findOne({
      where: { id: subcategoryId },
      relations: ['filters'],
    });
    if (!subcategory) throw new NotFoundException('Subcategoría no encontrada');

    const filters = await this.filterRepo.findByIds(filterIds);
    subcategory.filters = filters;

    return await this.subcategoryRepo.save(subcategory);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['subcategories'],
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    await this.categoryRepo.remove(category);
  }

  async deleteSubcategory(id: number) {
    const subcategory = await this.subcategoryRepo.findOne({ where: { id }, relations: ['filters'] });
    if (!subcategory) throw new NotFoundException('Subcategoría no encontrada');

    return await this.subcategoryRepo.remove(subcategory);
  }


  async createFilter(name: string, type: string) {
    const filter = this.filterRepo.create({ name, type });
    return await this.filterRepo.save(filter);
  }

  async updateFilter(id: number, body: UpdateFilterDto) {
    const filter = await this.filterRepo.findOne({ where: { id } });
    if (!filter) throw new NotFoundException('Filtro no encontrado');
    Object.assign(filter, body);
    return this.filterRepo.save(filter);
  }

  async deleteFilter(id: number): Promise<void> {
    // 1. Eliminar relaciones en subcategory_filters
    await this.subcategoryFiltersRepository.delete({ filter: { id } });

    // 2. Eliminar relaciones en product_filters
    await this.productFiltersRepository.delete({ filter: { id } });

    // 3. Eliminar el filtro
    const result = await this.filterRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`No existe el filtro con id ${id}`);
    }
  }





}

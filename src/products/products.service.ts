import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Brackets } from 'typeorm';
import { ProductDetails } from '../schemas/productos.schema';
import { Category } from '../schemas/category.schema';
import { Brand } from '../schemas/brand.schema';
import { Color } from '../schemas/color.schema';
import { Subcategory } from '../schemas/subcategory.schema';
import { Filter } from '../schemas/filters.schema';
import { LogService } from '../services/logs.service';

interface FilterWithValues {
  id: number;
  name: string;
  type: string;
  values: { product_id: number; value: string }[];
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductDetails)
    private readonly productDetailsRepo: Repository<ProductDetails>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(Color) private colorRepo: Repository<Color>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Filter)
    private readonly filterRepository: Repository<Filter>,
    private readonly logService: LogService
  ) { }

  async getAllProductDetails() {
    try {
      return await this.productDetailsRepo.find();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los productos.');
    }
  }

  async findByCategoryWithFilters(
    categoryName: string,
    minPrice?: number,
    maxPrice?: number,
    brandId?: number,
    colorId?: number
  ) {
    try {
      const category = await this.categoryRepo.findOne({ where: { name: categoryName } });
      if (!category) {
        return [];
      }

      const query = this.productDetailsRepo.createQueryBuilder('product')
        .where('product.category_id = :categoryId', { categoryId: category.id });

      if (minPrice) {
        query.andWhere('product.price >= :minPrice', { minPrice });
      }

      if (maxPrice) {
        query.andWhere('product.price <= :maxPrice', { maxPrice });
      }

      if (brandId) {
        query.andWhere('product.brand_id = :brandId', { brandId });
      }

      if (colorId) {
        query.andWhere('product.color_id = :colorId', { colorId });
      }

      return await query.getMany();
    } catch (error) {
      throw new InternalServerErrorException('No se pudo filtrar los productos.');
    }
  }



  async findByCategory(categoryId: number): Promise<ProductDetails[]> {
    try {
      return await this.productDetailsRepo.find({ where: { category_id: categoryId } });
    } catch (error) {
      await this.logService.createLog(`Error en findByCategory: ${error.message}`);
      throw new InternalServerErrorException('Error al buscar productos por categoría.');
    }
  }

  async findByName(productName: string): Promise<ProductDetails | null> {
    try {
      return await this.productDetailsRepo.findOne({
        where: { name: ILike(`%${productName.trim()}%`) } // 🔥 Permite búsquedas parciales y no distingue mayúsculas
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar el producto.');
    }
  }
  

  async searchProducts(query: string): Promise<ProductDetails[]> {
    try {
      if (!query) return [];
      const keywords = query.toLowerCase().trim().split(/\s+/);

      return await this.productDetailsRepo.createQueryBuilder('product')
        .where(new Brackets(qb => {
          keywords.forEach((word, index) => {
            if (index === 0) {
              qb.where('LOWER(product.name) LIKE :word', { word: `%${word}%` });
            } else {
              qb.andWhere('LOWER(product.name) LIKE :word', { word: `%${word}%` });
            }
          });
        }))
        .take(10)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('No se pudo completar la búsqueda.');
    }
  }


  async filterProducts(minPrice?: number, maxPrice?: number, brandId?: number, colorId?: number) {
    try {
      const query = this.productDetailsRepo.createQueryBuilder('product')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.color', 'color');

      if (minPrice) query.andWhere('product.price >= :minPrice', { minPrice });
      if (maxPrice) query.andWhere('product.price <= :maxPrice', { maxPrice });
      if (brandId) query.andWhere('product.brand_id = :brandId', { brandId });
      if (colorId) query.andWhere('product.color_id = :colorId', { colorId });

      return await query.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error al filtrar productos.');
    }
  }

  async getUniqueBrands(): Promise<Brand[]> {
    try {
      return await this.brandRepo.find();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener marcas.');
    }
  }

  async getUniqueColors(): Promise<Color[]> {
    try {
      return await this.colorRepo.find();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener colores.');
    }
  }

  async getProductsBySubcategoryName(
    subcategoryName: string,
    filters: any, 
    minPrice: number,
    maxPrice: number,
    brands: string[]  
  ): Promise<{ products: ProductDetails[], filters: FilterWithValues[], brands: string[], allBrands: string[] }> {
    try {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { name: subcategoryName },
        relations: ['products', 'filters', 'products.brand'], 
      });

      if (!subcategory) {
        await this.logService.createLog(`Subcategoría no encontrada: ${subcategoryName}`);
        throw new NotFoundException(`La subcategoría "${subcategoryName}" no fue encontrada.`);
      }

      let productsQuery = this.productDetailsRepo.createQueryBuilder('p')
        .innerJoin('subcategory_filters', 'sf', 'sf.subcategory_id = :subcategoryId', { subcategoryId: subcategory.id })
        .leftJoin('product_filters', 'pf', 'pf.product_id = p.id')
        .leftJoinAndSelect('p.brand', 'brand')
        .where('p.subcategory_id = :subcategoryId', { subcategoryId: subcategory.id });

      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceCondition = [];
        if (minPrice !== undefined) {
          priceCondition.push('p.price >= :minPrice');
        }
        if (maxPrice !== undefined) {
          priceCondition.push('p.price <= :maxPrice');
        }
        if (priceCondition.length > 0) {
          productsQuery = productsQuery.andWhere(priceCondition.join(' AND '), {
            minPrice,
            maxPrice,
          });
        }
      }
      if (brands && brands.length > 0) {
        productsQuery = productsQuery.andWhere('brand.name IN (:...brands)', { brands });
      }
      if (filters && Object.keys(filters).length > 0) {
        Object.keys(filters).forEach((filterId) => {
          if (filterId !== 'minPrice' && filterId !== 'maxPrice' && filterId !== 'brands') {
            const values = filters[filterId];
            productsQuery = productsQuery.andWhere('pf.filter_id = :filterId AND pf.value IN (:...values)', { filterId, values });
          }
        });
      }

      const filteredProducts = await productsQuery.getMany();
      const allBrands = Array.from(new Set(
        subcategory.products.map(product => product.brand ? product.brand.name : 'Sin marca')
      ));
      const availableBrands = Array.from(new Set(
        filteredProducts.map(product => product.brand ? product.brand.name : 'Sin marca')
      ));

      const filtersData = await this.filterRepository
        .createQueryBuilder('filter')
        .innerJoin('subcategory_filters', 'sf', 'sf.filter_id = filter.id')
        .innerJoin('product_filters', 'pf', 'pf.filter_id = filter.id')
        .innerJoin('products', 'p', 'pf.product_id = p.id')
        .where('sf.subcategory_id = :subcategoryId', { subcategoryId: subcategory.id })
        .andWhere('p.id IN (:...productIds)', { productIds: filteredProducts.map(p => p.id) })  
        .select([
          'filter.id AS id',
          'filter.name AS name',
          'pf.value AS value',
          'COUNT(p.id) AS product_count',
        ])
        .groupBy('filter.id, filter.name, pf.value')
        .getRawMany();

      const filtersGrouped = filtersData.reduce((acc, filter) => {
        const existingFilter = acc.find(f => f.id === filter.id);
        if (existingFilter) {
          existingFilter.values.push({ value: filter.value, product_count: parseInt(filter.product_count) });
        } else {
          acc.push({
            id: filter.id,
            name: filter.name,
            values: [{ value: filter.value, product_count: parseInt(filter.product_count) }]
          });
        }
        return acc;
      }, []);

      return {
        products: filteredProducts,
        filters: filtersGrouped,
        brands: availableBrands,   
        allBrands: allBrands       
      };
    }  catch (error) {
      throw new InternalServerErrorException('No se pudieron obtener los productos de la subcategoría.');
    }
  }

  async getProductSpecifications(productId: number) {
    try {
      const specifications = await this.productDetailsRepo.findOne({
        where: { id: productId },
        relations: ['specifications'],
      });

      if (!specifications) {
        throw new NotFoundException('No se encontraron especificaciones para este producto.');
      }

      return specifications.specifications;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener especificaciones.');
    }
  }
}




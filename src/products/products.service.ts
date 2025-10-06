import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Brackets } from 'typeorm';
import { ProductDetails } from '../schemas/productos.schema';
import { Category } from '../schemas/category.schema';
import { Brand } from '../schemas/brand.schema';
import { Color } from '../schemas/color.schema';
import { Subcategory } from '../schemas/subcategory.schema';
import { Filter } from '../schemas/filters.schema';
import { LogService } from '../services/logs.service';
import { Review } from 'src/schemas/review.schema';
import { HttpService } from '@nestjs/axios';
import { OrderItem } from 'src/schemas/order-item.schema';

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
    private readonly logService: LogService,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly httpService: HttpService,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>
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
    colorId?: number,
  ) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { name: categoryName },
      });
      if (!category) {
        return [];
      }

      const query = this.productDetailsRepo
        .createQueryBuilder('product')
        .where('product.category_id = :categoryId', {
          categoryId: category.id,
        });

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
      throw new InternalServerErrorException(
        'No se pudo filtrar los productos.',
      );
    }
  }

  async findByCategory(categoryId: number): Promise<ProductDetails[]> {
    try {
      return await this.productDetailsRepo.find({
        where: { category_id: categoryId },
      });
    } catch (error) {
      await this.logService.createLog(
        `Error en findByCategory: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error al buscar productos por categoría.',
      );
    }
  }

  async findByName(productName: string): Promise<ProductDetails | null> {
    try {
      return await this.productDetailsRepo.findOne({
        where: { name: ILike(`%${productName.trim()}%`) }, // 🔥 Permite búsquedas parciales y no distingue mayúsculas
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar el producto.');
    }
  }

  async searchProducts(query: string): Promise<ProductDetails[]> {
    try {
      if (!query) return [];
      const keywords = query.toLowerCase().trim().split(/\s+/);

      return await this.productDetailsRepo
        .createQueryBuilder('product')
        .where(
          new Brackets((qb) => {
            keywords.forEach((word, index) => {
              if (index === 0) {
                qb.where('LOWER(product.name) LIKE :word', {
                  word: `%${word}%`,
                });
              } else {
                qb.andWhere('LOWER(product.name) LIKE :word', {
                  word: `%${word}%`,
                });
              }
            });
          }),
        )
        .take(10)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudo completar la búsqueda.',
      );
    }
  }

  async filterProducts(
    minPrice?: number,
    maxPrice?: number,
    brandId?: number,
    colorId?: number,
  ) {
    try {
      const query = this.productDetailsRepo
        .createQueryBuilder('product')
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
  ): Promise<{
    products: ProductDetails[];
    filters: FilterWithValues[];
    brands: {
      id: number;
      name: string;
      product_ids: number[];
    }[];
  }> {
    try {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { name: subcategoryName },
        relations: ['products', 'products.brand'],
      });

      if (!subcategory) {
        await this.logService.createLog(
          `Subcategoría no encontrada: ${subcategoryName}`,
        );
        throw new NotFoundException(
          `La subcategoría "${subcategoryName}" no fue encontrada.`,
        );
      }

      const products = await this.productDetailsRepo.find({
        where: { subcategory: { id: subcategory.id } },
        relations: ['brand'],
      });

      const productIds = products.map(p => p.id);

      const filtersData = await this.filterRepository
        .createQueryBuilder('filter')
        .innerJoin('subcategory_filters', 'sf', 'sf.filter_id = filter.id')
        .innerJoin('product_filters', 'pf', 'pf.filter_id = filter.id')
        .innerJoin('products', 'p', 'pf.product_id = p.id')
        .where('sf.subcategory_id = :subcategoryId', {
          subcategoryId: subcategory.id,
        })
        .andWhere('p.id IN (:...productIds)', { productIds })
        .select([
          'filter.id AS id',
          'filter.name AS name',
          'pf.value AS value',
          'COUNT(p.id) AS product_count',
          'ARRAY_AGG(p.id) AS product_ids',
        ])
        .groupBy('filter.id, filter.name, pf.value')
        .getRawMany();

      const filtersGrouped = filtersData.reduce((acc, filter) => {
        const existing = acc.find(f => f.id === filter.id);
        if (existing) {
          existing.values.push({
            value: filter.value,
            product_count: parseInt(filter.product_count),
            product_ids: filter.product_ids,
          });
        } else {
          acc.push({
            id: filter.id,
            name: filter.name,
            values: [{
              value: filter.value,
              product_count: parseInt(filter.product_count),
              product_ids: filter.product_ids,
            }],
          });
        }
        return acc;
      }, []);

      // ✅ Agrupar marcas con productos correspondientes
      const brandMap = new Map<number, { id: number; name: string; product_ids: number[] }>();

      for (const product of products) {
        if (!product.brand) continue;
        const existing = brandMap.get(product.brand.id);
        if (existing) {
          existing.product_ids.push(product.id);
        } else {
          brandMap.set(product.brand.id, {
            id: product.brand.id,
            name: product.brand.name,
            product_ids: [product.id],
          });
        }
      }

      const brands = Array.from(brandMap.values());

      return {
        products,
        filters: filtersGrouped,
        brands, // Ahora contiene id, nombre y product_ids
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudieron obtener los productos de la subcategoría.',
      );
    }
  }



  async getProductSpecifications(productId: number) {
    try {
      const specifications = await this.productDetailsRepo.findOne({
        where: { id: productId },
        relations: ['specifications'],
      });

      if (!specifications) {
        throw new NotFoundException(
          'No se encontraron especificaciones para este producto.',
        );
      }

      return specifications.specifications;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener especificaciones.',
      );
    }
  }

  async getRecommendedProducts(userId?: number): Promise<any[]> {
    try {
      // ✅ Si no hay usuario autenticado, regresar productos aleatorios directamente
      if (!userId) {
        const randomIds = getRandomUniqueIds(1, 259, 10);

        const { entities, raw } = await this.productDetailsRepo
          .createQueryBuilder('product')
          .leftJoin('product.reviews', 'review')
          .leftJoin('product.category', 'category')
          .where('product.id IN (:...ids)', { ids: randomIds })
          .addSelect('AVG(review.rating)', 'avg_rating')
          .addSelect('COUNT(review.id)', 'review_count')
          .addSelect('category.name', 'category_name')
          .groupBy('product.id, category.id, category.name')
          .getRawAndEntities();

        return entities.map((product, i) => ({
          ...product,
          avg_rating: parseFloat(raw[i]?.avg_rating) || 0,
          review_count: parseInt(raw[i]?.review_count) || 0,
          category: raw[i]?.category_name || null,
        }));
      }


      // ✅ Si hay usuario, consultar sus productos comprados
      const productosComprados = await this.orderItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.order', 'order')
        .innerJoin('item.product', 'product')
        .where('order.user.id = :userId', { userId })
        .select('DISTINCT product.id', 'productId')
        .getRawMany();

      const productIdsComprados = productosComprados.map(p => String(p.productId));

      // Si no compró nada, usar fallback
      if (productIdsComprados.length === 0) {
        return this.getFallbackProducts();
      }

      // Llamar microservicio
      const { data } = await this.httpService
        .post('https://pci-tecnologia-recommendation.yf3yhp.easypanel.host/recomendar', {
          productos: productIdsComprados,
        })
        .toPromise();

      const idsRecomendados: string[] = data.recomendaciones || [];

      // Si no hay recomendaciones, usar fallback
      if (idsRecomendados.length === 0) {
        return this.getFallbackProducts();
      }

      // Obtener productos recomendados enriquecidos
      const productosRecomendados = await this.productDetailsRepo
        .createQueryBuilder('product')
        .leftJoin('product.reviews', 'review')
        .leftJoin('product.category', 'category')
        .where('product.id IN (:...ids)', { ids: idsRecomendados })
        .addSelect('AVG(review.rating)', 'avg_rating')
        .addSelect('COUNT(review.id)', 'review_count')
        .addSelect('category.name', 'category_name')
        .groupBy('product.id, category.id, category.name')
        .orderBy('product.id') // seguro
        .getRawAndEntities();

      return productosRecomendados.entities.map((product, i) => ({
        ...product,
        avg_rating: parseFloat(productosRecomendados.raw[i]?.avg_rating) || 0,
        review_count: parseInt(productosRecomendados.raw[i]?.review_count) || 0,
        category: productosRecomendados.raw[i]?.category_name || null,
      }));
    } catch (error) {
      console.error('Error en getRecommendedProducts:', error);
      throw new InternalServerErrorException('No se pudieron obtener recomendaciones.');
    }
  }

  // 🔁 Factorizamos el fallback para usarlo en 2 lugares
  private async getFallbackProducts(): Promise<any[]> {
    // Generar 10 IDs aleatorios únicos entre 1 y 259
    const getRandomUniqueIds = (min: number, max: number, count: number): number[] => {
      const ids = new Set<number>();
      while (ids.size < count) {
        const random = Math.floor(Math.random() * (max - min + 1)) + min;
        ids.add(random);
      }
      return Array.from(ids);
    };

    const randomIds = getRandomUniqueIds(1, 259, 10);

    // Obtener productos con esos IDs aleatorios (agregados con ratings y categoría)
    const { entities, raw } = await this.productDetailsRepo
      .createQueryBuilder('product')
      .leftJoin('product.reviews', 'review')
      .leftJoin('product.category', 'category')
      .where('product.id IN (:...ids)', { ids: randomIds })
      .addSelect('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'review_count')
      .addSelect('category.name', 'category_name')
      .groupBy('product.id, category.id, category.name')
      .getRawAndEntities();

    return entities.map((product, i) => ({
      ...product,
      avg_rating: parseFloat(raw[i]?.avg_rating) || 0,
      review_count: parseInt(raw[i]?.review_count) || 0,
      category: raw[i]?.category_name || null,
    }));
  }



  async getDestacadosProducts(): Promise<any[]> {
    try {
      const { entities, raw } = await this.productDetailsRepo
        .createQueryBuilder('product')
        .leftJoin('product.reviews', 'review')
        .leftJoin('product.category', 'category')
        .addSelect('AVG(review.rating)', 'avg_rating')
        .addSelect('COUNT(review.id)', 'review_count')
        .addSelect('category.name', 'category_name')
        .addSelect('category.id', 'category_id')
        .groupBy('product.id, category.id, category.name')
        .orderBy('product.created_at', 'DESC') // más recientes primero
        .limit(10)
        .getRawAndEntities();

      return entities.map((product, i) => ({
        ...product,
        avg_rating: parseFloat(raw[i]?.avg_rating) || 0,
        review_count: parseInt(raw[i]?.review_count) || 0,
        category: raw[i]?.category_name || null,
      }));
    } catch (error) {
      console.error('Error en getRecommendedProducts:', error);
      throw new InternalServerErrorException(
        'No se pudieron cargar productos recientes.',
      );
    }
  }


  async getTopSubcategoriesWithMostProducts(): Promise<
    { name: string; image: string; product_count: number; category_name: string }[]
  > {
    try {
      const result = await this.productDetailsRepo
        .createQueryBuilder('product')
        .select('subcategory.name', 'name')
        .addSelect('subcategory.image', 'image')
        .addSelect('COUNT(product.id)', 'product_count')
        .addSelect('category.name', 'category_name')
        .innerJoin('product.subcategory', 'subcategory')
        .innerJoin('subcategory.category', 'category')
        .groupBy('subcategory.name')
        .addGroupBy('subcategory.image')
        .addGroupBy('category.name')
        .orderBy('product_count', 'DESC')
        .limit(10)
        .getRawMany();

      return result.map((r) => ({
        name: r.name,
        image: r.image,
        product_count: parseInt(r.product_count),
        category_name: r.category_name,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener las subcategorías con más productos.',
      );
    }
  }

  async getRelatedProducts(productId: number): Promise<any[]> {
    try {
      // 1. Obtener producto y subcategoría
      const product = await this.productDetailsRepo.findOne({
        where: { id: productId },
        relations: ['subcategory'],
      });

      if (!product || !product.subcategory) {
        throw new NotFoundException('Producto o subcategoría no encontrados.');
      }

      // 2. Productos de la misma subcategoría (excluyendo el actual)
      const sameSubcategoryProducts = await this.productDetailsRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.subcategory', 'subcategory')
        .where('subcategory.id = :subcategoryId', { subcategoryId: product.subcategory.id })
        .andWhere('product.id != :productId', { productId })
        .orderBy('RANDOM()')
        .limit(10)
        .getMany();

      // 3. Llamar a la API de recomendaciones Python
      const response = await this.httpService.axiosRef.post(
        'https://pci-tecnologia-recommendation.yf3yhp.easypanel.host/recomendar',
        { productos: [String(productId)] },
      );
      const recommendedIds: string[] = response.data.recomendaciones || [];

      // 4. Buscar productos por ID recomendados (si no es el mismo)
      const recommendedProducts = recommendedIds.length
        ? await this.productDetailsRepo
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.brand', 'brand')
          .leftJoinAndSelect('product.subcategory', 'subcategory')
          .where('product.id IN (:...ids)', { ids: recommendedIds.map(id => +id) })
          .andWhere('product.id != :productId', { productId })
          .getMany()
        : [];

      // 5. Combinar sin duplicados
      const allProductsMap = new Map<number, any>();
      [...sameSubcategoryProducts, ...recommendedProducts].forEach((p) =>
        allProductsMap.set(p.id, p),
      );

      // 6. Enriquecer con reviews
      const enrichedProducts = await Promise.all(
        Array.from(allProductsMap.values()).map(async (p) => {
          const { averageRating, totalReviews } = await this.reviewRepo
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'averageRating')
            .addSelect('COUNT(review.id)', 'totalReviews')
            .where('review.product_id = :productId', { productId: p.id })
            .getRawOne();

          return {
            ...p,
            averageRating: parseFloat(averageRating) || 0,
            totalReviews: parseInt(totalReviews) || 0,
          };
        }),
      );

      return enrichedProducts;
    } catch (error) {
      console.error('Error en getRelatedProducts:', error);
      await this.logService.createLog(`Error en getRelatedProducts: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener productos relacionados.');
    }
  }




}
function getRandomUniqueIds(min: number, max: number, count: number): number[] {
  const ids = new Set<number>();
  while (ids.size < count) {
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    ids.add(random);
  }
  return Array.from(ids);
}

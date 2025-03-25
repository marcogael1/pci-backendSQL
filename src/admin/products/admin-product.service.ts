import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductDetails } from '../../schemas/productos.schema';
import { Subcategory } from 'src/schemas/subcategory.schema';
import { Category } from 'src/schemas/category.schema';
import { ProductSale } from 'src/schemas/productSale.schema';

@Injectable()
export class AdminProductService {
  constructor(
    @InjectRepository(ProductDetails)
    private readonly productDetailsRepo: Repository<ProductDetails>,    
    @InjectRepository(Subcategory)
    private readonly subcategoryRepo: Repository<Subcategory>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getAllProductDetails() {
    try {
      return await this.productDetailsRepo.find({
        select: ['name', 'stock'], // Solo seleccionamos estos campos
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los productos.');
    }
  }

  async getProductsBySubcategory(subcategoryId: number) {
    try {
      const result = await this.productDetailsRepo
        .createQueryBuilder('product')
        .leftJoin('product.subcategory', 'subcategory')
        .leftJoin(
          qb =>
            qb
              .select('ps.product_id', 'ps_product_id')
              .addSelect('SUM(ps.quantity_sold)', 'total_ventas')
              .from(ProductSale, 'ps')
              .groupBy('ps.product_id'),
          'ventas',
          'ventas.ps_product_id = product.id'
        )
        .where('subcategory.id = :subcategoryId', { subcategoryId })
        .select([
          'product.id AS id',
          'product.name AS name',
          'product.price AS price',
          'product.stock AS stock',
          'product.image_url AS image_url',
          'COALESCE(ventas.total_ventas, 0) AS total_ventas'
        ])
        .getRawMany();
  
      return result.map(row => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        stock: row.stock,
        image_url: row.image_url,
        totalVentas: Number(row.total_ventas)
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los productos con ventas.');
    }
  }
  
  
  async getAllSubcategories() {
    try {
      return await this.subcategoryRepo.find({ 
        select: ['id', 'name'], 
        relations: ['category'], // Asegurar que incluya la categoría
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener subcategorías.');
    }
  }

  // 🔥 NUEVO: Obtener todas las categorías
  async getAllCategories() {
    try {
      return await this.categoryRepo.find({
        select: ['id', 'name'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener categorías.');
    }
  }
}

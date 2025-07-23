import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductDetails } from '../../schemas/productos.schema';
import { Subcategory } from 'src/schemas/subcategory.schema';
import { Category } from 'src/schemas/category.schema';
import { ProductSale } from 'src/schemas/productSale.schema';
import { ProductSpecification } from 'src/schemas/product_specifications.schema';
import { ProductFilter } from 'src/schemas/productFilters.schema';
import { Brand } from 'src/schemas/brand.schema';

@Injectable()
export class AdminProductService {
  constructor(
    @InjectRepository(ProductDetails)
    private readonly productDetailsRepo: Repository<ProductDetails>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepo: Repository<Subcategory>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductSpecification)
    private readonly productSpecificationRepo: Repository<ProductSpecification>,

    @InjectRepository(ProductFilter)
    private readonly productFilterRepo: Repository<ProductFilter>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>
  ) { }

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
          (qb) =>
            qb
              .select('ps.product_id', 'ps_product_id')
              .addSelect('SUM(ps.quantity_sold)', 'total_ventas')
              .from(ProductSale, 'ps')
              .groupBy('ps.product_id'),
          'ventas',
          'ventas.ps_product_id = product.id',
        )
        .where('subcategory.id = :subcategoryId', { subcategoryId })
        .select([
          'product.id AS id',
          'product.name AS name',
          'product.price AS price',
          'product.stock AS stock',
          'product.image_url AS image_url',
          'COALESCE(ventas.total_ventas, 0) AS total_ventas',
          'subcategory.name AS subcategory_name',
        ])
        .getRawMany();

      return result.map((row) => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        stock: row.stock,
        image_url: row.image_url,
        totalVentas: Number(row.total_ventas),
        subcategoryName: row.subcategory_name,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los productos con ventas.',
      );
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

  // admin-product.service.ts

  async getProductDetailsById(id: number): Promise<any> {
    const product = await this.productDetailsRepo.findOne({
      where: { id },
      relations: [
        'category',
        'subcategory',
        'brand',
        'specifications',
        'productFilters',
        'productFilters.filter',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      created_at: product.created_at,
      updated_at: product.updated_at,

      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
      } : null,

      subcategory: product.subcategory ? {
        id: product.subcategory.id,
        name: product.subcategory.name,
      } : null,

      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,

      specifications: product.specifications?.map(spec => ({
        id: spec.id,
        title: spec.title,
        specification: spec.specification,
        category_name: spec.category_name,
      })) || [],

      filters: product.productFilters?.map(pf => ({
        id: pf.filter.id,
        name: pf.filter.name,
        type: pf.filter.type,
        value: pf.value,
      })) || [],
    };
  }
  async updateProductById(id: number, updateData: any): Promise<any> {

    const product = await this.productDetailsRepo.findOne({
      where: { id },
      relations: ['specifications', 'productFilters'],
    });

    if (!product) throw new NotFoundException('Producto no encontrado');


    product.name = updateData.name;
    product.price = updateData.price;
    product.stock = updateData.stock;
    product.brand = updateData.brand_id ? ({ id: updateData.brand_id } as Brand) : null;
    product.category = updateData.category_id ? ({ id: updateData.category_id } as Category) : null;
    product.subcategory = updateData.subcategory_id ? ({ id: updateData.subcategory_id } as Subcategory) : null;
    delete (product as any).image_url;
    const savedProduct = await this.productDetailsRepo.save(product);

    // ✅ Especificaciones (Recrear)
    if (updateData.specifications) {
      await this.productSpecificationRepo.delete({ product: { id } });

      for (const spec of updateData.specifications) {
        await this.productSpecificationRepo.save({
          product: { id: savedProduct.id },
          title: spec.title,
          specification: spec.specification,
          category_name: spec.category_name || '',
        });
      }
    }

    // ✅ Filtros (Recrear)
    if (updateData.filters) {
      console.log('♻️ Eliminando filtros existentes...');
      await this.productFilterRepo.delete({ product: { id } });

      for (const filtro of updateData.filters) {
        await this.productFilterRepo.save({
          product: { id: savedProduct.id },
          filter: { id: filtro.id },
          value: filtro.value,
        });
      }
    }

    console.log('✅ Actualización finalizada');
    return savedProduct;
  }



async createProduct(body: any) {
  try {
    const imageUrls = body.image_url || [];

    const product = this.productDetailsRepo.create({
      name: body.name,
      price: parseFloat(body.price),
      stock: parseInt(body.stock),
      brand: { id: body.brand_id },
      category: { id: body.category_id },
      subcategory: { id: body.subcategory_id },
      color_id: body.color_id ?? 1,
      image_url: JSON.stringify(imageUrls),
    });

    // Guardar el producto y obtener el ID
    const saved = await this.productDetailsRepo.save(product);
    const productId = saved.id;
    // Guardar especificaciones si existen
    if (Array.isArray(body.specifications)) {
      for (const spec of body.specifications) {
        const specPayload = {
          title: spec.title,
          specification: spec.specification,
          category_name: spec.category_name || 'General',
          product_id: productId,
        };
        await this.productSpecificationRepo.save(specPayload);
      }
    } else {
      console.log('ℹ️ No se enviaron especificaciones.');
    }

    // Guardar filtros si existen
    if (Array.isArray(body.filters)) {
      for (const filter of body.filters) {
        const filterPayload = {
          value: filter.value,
          filter: { id: filter.id },
          product_id: productId,
        };
        await this.productFilterRepo.save(filterPayload);
      }
    } else {
      console.log('ℹ️ No se enviaron filtros.');
    }

    return saved;
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    throw new BadRequestException('Error al crear el producto');
  }
}


  async getFiltersBySubcategory(subcategoryId: number) {
    const subcategory = await this.subcategoryRepo.findOne({
      where: { id: subcategoryId },
      relations: ['filters']
    });

    return subcategory?.filters || [];
  }
  async findAll(): Promise<Brand[]> {
    return this.brandRepo.find();
  }


}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDetails } from '../../schemas/productos.schema';
import { AdminProductService } from './admin-product.service';
import { AdminProductController } from './admin-product.controller';
import { Subcategory } from 'src/schemas/subcategory.schema';
import { Category } from 'src/schemas/category.schema';
import { ProductSale } from 'src/schemas/productSale.schema';
import { Brand } from 'src/schemas/brand.schema';
import { Color } from 'src/schemas/color.schema';
import { Filter } from 'src/schemas/filters.schema';
import { Review } from 'src/schemas/review.schema';
import { ProductFilter } from 'src/schemas/productFilters.schema';
import { OrderItem } from 'src/schemas/order-item.schema';
import { ProductSpecification } from 'src/schemas/product_specifications.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductDetails,
      Category,
      Brand,
      Color,
      Subcategory,
      Filter,
      Review,
      ProductFilter,
      OrderItem,
      ProductSpecification
    ]),
  ],
  controllers: [AdminProductController],
  providers: [AdminProductService],
  exports: [AdminProductService],
})
export class AdminProductModule {}

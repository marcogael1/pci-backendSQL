import { ProductService } from './products.service';
import { ProductController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDetails } from '../schemas/productos.schema';
import { Category } from '../schemas/category.schema';
import { Module } from '@nestjs/common';
import { Brand } from 'src/schemas/brand.schema';
import { Color } from 'src/schemas/color.schema';
import { CategoryModule } from 'src/category/category.module';
import { Subcategory } from 'src/schemas/subcategory.schema';
import { Filter } from 'src/schemas/filters.schema';
import { LogsModule } from 'src/services/logs.module';
import { Review } from 'src/schemas/review.schema';
import { ProductFilter } from 'src/schemas/productFilters.schema';

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
      ProductFilter
    ]),
    CategoryModule,
    LogsModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}

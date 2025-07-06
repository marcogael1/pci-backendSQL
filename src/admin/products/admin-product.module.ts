import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDetails } from '../../schemas/productos.schema';
import { AdminProductService } from './admin-product.service';
import { AdminProductController } from './admin-product.controller';
import { Subcategory } from 'src/schemas/subcategory.schema';
import { Category } from 'src/schemas/category.schema';
import { ProductSale } from 'src/schemas/productSale.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductDetails,
      Subcategory,
      Category,
      ProductSale,
    ]),
  ],
  controllers: [AdminProductController],
  providers: [AdminProductService],
  exports: [AdminProductService],
})
export class AdminProductModule {}

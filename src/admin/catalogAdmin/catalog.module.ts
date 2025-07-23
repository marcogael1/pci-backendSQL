
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Category } from 'src/schemas/category.schema';
import { Subcategory } from 'src/schemas/subcategory.schema';
import { Filter } from 'src/schemas/filters.schema';
import { SubcategoryFilter } from 'src/schemas/subcategory_filters.schema';
import { ProductFilter } from 'src/schemas/productFilters.schema';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Subcategory, Filter, SubcategoryFilter, ProductFilter])],
  controllers: [CatalogController],
  providers: [CatalogService, JwtService],
})
export class CatalogModule {}

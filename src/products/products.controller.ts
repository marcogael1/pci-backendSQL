import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ProductService } from './products.service';
import { ProductDetails } from 'src/schemas/productos.schema';
import { Filter } from '../schemas/filters.schema';

interface FilterWithValues {
  id: number;
  name: string;
  type: string;
  values: { product_id: number; value: string }[];
}

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get()
  async getAllProducts() {
    return await this.productService.getAllProductDetails();
  }

  @Get('by-category/:name')
  async getProductsByCategory(
    @Param('name') categoryName: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('brandId') brandId?: number,
    @Query('colorId') colorId?: number,
  ) {
    return this.productService.findByCategoryWithFilters(
      categoryName,
      minPrice,
      maxPrice,
      brandId,
      colorId,
    );
  }

  @Get('by-name')
  async getProductByName(@Query('name') productName: string) {
    const decodedProductName = decodeURIComponent(productName); // 🔥 Decodifica caracteres
    return this.productService.findByName(decodedProductName);
  }

  @Get('search')
  async searchProducts(@Query('query') query: string) {
    return await this.productService.searchProducts(query);
  }

  @Get('filter')
  async filterProducts(
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('brandId') brandId?: number,
    @Query('colorId') colorId?: number,
  ) {
    return this.productService.filterProducts(
      minPrice,
      maxPrice,
      brandId,
      colorId,
    );
  }

  @Get('brands')
  async getBrands() {
    return this.productService.getUniqueBrands();
  }
  @Get('colors')
  async getColors() {
    return this.productService.getUniqueColors();
  }

@Get('by-subcategory/:subcategoryName')
async getProductsBySubcategory(
  @Param('subcategoryName') subcategoryName: string,
): Promise<{
  products: ProductDetails[];
  filters: FilterWithValues[];
  brands: {
    id: number;
    name: string;
    product_ids: number[];
  }[];
}> {
  return this.productService.getProductsBySubcategoryName(subcategoryName);
}



  @Get(':id/specifications')
  async getProductSpecifications(@Param('id') productId: number) {
    return await this.productService.getProductSpecifications(productId);
  }

  @Get('recomendados')
  async getRecommendedProducts() {
    return await this.productService.getRecommendedProducts();
  }


  @Get('top-subcategories')
  async getTopSubcategories() {
    return this.productService.getTopSubcategoriesWithMostProducts();
  }

  @Get(':id/relacionados')
  async getRelated(@Param('id') id: number) {
    return this.productService.getRelatedProducts(id);
  }

}

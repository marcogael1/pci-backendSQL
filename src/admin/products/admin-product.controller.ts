import {
  Controller,
  Get,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  Param,
  ParseIntPipe,
  Body,
  Put,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/jwtauthguard.guard';
import { AdminProductService } from './admin-product.service';

@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) { }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllProducts(@Req() req) {
     if (req.user?.role !== 'admin' && req.user?.role !== 'empleado') {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso.',
      );
    }
    return await this.adminProductService.getAllProductDetails();
  }

  @Get('filter')
  @UseGuards(JwtAuthGuard)
  async getProductsBySubcategory(@Req() req) {
    const subcategoryId = Number(req.query.subcategoryId);
     if (req.user?.role !== 'admin' && req.user?.role !== 'empleado') {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso.',
      );
    }
    return await this.adminProductService.getProductsBySubcategory(
      subcategoryId,
    );
  }

  @Get('subcategories')
  @UseGuards(JwtAuthGuard)
  async getAllSubcategories(@Req() req) {
     if (req.user?.role !== 'admin' && req.user?.role !== 'empleado') {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso.',
      );
    }

    return await this.adminProductService.getAllSubcategories();
  }

  @Get('detalles/:id')
  async getProductDetailsById(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductService.getProductDetailsById(id);
  }

  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any
  ) {
    return this.adminProductService.updateProductById(id, updateData);
  }

  @Get('brands')
  async getAllBrands() {
    return this.adminProductService.findAll();
  }

  @Post()
  async createProduct(@Body() body: any) {
    return this.adminProductService.createProduct(body);
  }


  @Get('filters/:subcategoryId')
  async getFiltersForSubcategory(@Param('subcategoryId') subcategoryId: number) {
    return this.adminProductService.getFiltersBySubcategory(+subcategoryId);
  }
}

import {
  Controller,
  Get,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/jwtauthguard.guard';
import { AdminProductService } from './admin-product.service';

@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllProducts(@Req() req) {
    if (req.user.role !== 'admin') {
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
    if (req.user.role !== 'admin') {
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
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso.',
      );
    }

    return await this.adminProductService.getAllSubcategories();
  }
}

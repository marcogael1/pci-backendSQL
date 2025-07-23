import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { IsString } from 'class-validator';

export class UpdateFilterDto {
  @IsString()
  name: string;

  @IsString()
  type: string;
}

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  getCatalogData() {
    return this.catalogService.getAllCatalogData();
  }

  @Post('category')
  createCategory(@Body('name') name: string) {
    return this.catalogService.createCategory(name);
  }

  @Post('subcategory')
  createSubcategory(
    @Body('name') name: string,
    @Body('category_id', ParseIntPipe) categoryId: number,
    @Body('image') image: string,
  ) {
    return this.catalogService.createSubcategory(name, categoryId, image);
  }

  @Post('subcategory/:id/filters')
  linkFiltersToSubcategory(
    @Param('id', ParseIntPipe) subcategoryId: number,
    @Body('filter_ids') filterIds: number[],
  ) {
    return this.catalogService.linkFiltersToSubcategory(subcategoryId, filterIds);
  }

  @Delete('category/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deleteCategory(id);
  }

  @Delete('subcategory/:id')
  deleteSubcategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deleteSubcategory(id);
  }

  @Post('filter')
  createFilter(@Body('name') name: string, @Body('type') type: string) {
    return this.catalogService.createFilter(name, type);
  }

  @Put('filter/:id')
  updateFilter(@Param('id') id: number, @Body() body: UpdateFilterDto) {
    return this.catalogService.updateFilter(id, body);
  }

  @Delete('filter/:id')
  deleteFilter(@Param('id') id: number) {
    return this.catalogService.deleteFilter(id);
  }


}

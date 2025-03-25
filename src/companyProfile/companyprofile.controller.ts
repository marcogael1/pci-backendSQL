import { Controller, Get, Post, Put, Delete, Body, Param,NotFoundException } from '@nestjs/common';
import { CompanyProfileService } from './companyprofile.service';

@Controller('company-profile')
export class CompanyProfileController {
  constructor(private readonly companyProfileService: CompanyProfileService) {}

  @Post()
  async create(@Body() data: any) {
    return await this.companyProfileService.create(data);
  }

  @Get()
  async findOne() {
    const profile = await this.companyProfileService.findOne();
    if (!profile) {
      throw new NotFoundException('Perfil de empresa no encontrado');
    }
    return profile;
  }
    
  
  @Put()
  async update(@Body() data: any) {
    return await this.companyProfileService.update(data);
  }

  @Delete()
  async delete() {
    return await this.companyProfileService.delete();
  }
}

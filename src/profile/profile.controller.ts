// src/profile/profile.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { IsOptional, IsString } from 'class-validator';
export class UpdateDireccionDto {
  @IsString() state: string;
  @IsString() city: string;
  @IsString() colony: string;
  @IsString() street: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() postalCode: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() isDefault?: boolean;
}

@Controller('profile')
export class ProfileController {
  direccionService: any;
  constructor(private readonly profileService: ProfileService) { }

  @Get(':id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    const profile = await this.profileService.getUserProfile(id);
    return {
      message: 'Perfil encontrado correctamente',
      data: profile,
    };
  }

  @Patch(':id')
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<{ username: string; email: string; cellPhone: string; birthDate: Date; surnames: string }>
  ) {
    return this.profileService.updateProfile(id, updateData);
  }

  @Get('usuario/:id')
  async getDireccionByUserId(@Param('id') userId: number) {
    return this.profileService.getDireccionByUserId(userId);
  }

  @Put('usuario/:id')
  async updateDireccionByUserId(
    @Param('id') userId: number,
    @Body() dto: UpdateDireccionDto,
  ) {
    return this.profileService.updateDireccionByUserId(userId, dto);
  }

}

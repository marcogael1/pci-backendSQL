// src/profile/profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/schemas/user.schema';
import { Direccion } from 'src/schemas/address.schema';
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


@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Direccion)
    private direccionRepository: Repository<Direccion>,
  ) { }

  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'cellPhone', 'birthDate', 'surnames'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async updateProfile(userId: number, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.userRepository.update(userId, updateData);
    return this.getUserProfile(userId);
  }


  async getDireccionByUserId(userId: number) {
    const direccion = await this.direccionRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return direccion;
  }

async updateDireccionByUserId(userId: number, dto: UpdateDireccionDto) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['direcciones'],
  });

  if (!user) throw new NotFoundException('Usuario no encontrado');

  let direccion = user.direcciones[0];

  const dtoMapped = {
    estado: dto.state,
    municipio: dto.city,
    colonia: dto.colony,
    calle: dto.street,
    codigo_postal: dto.postalCode,
    referencias: dto.instructions,
  };

  if (!direccion) {
    direccion = this.direccionRepository.create({ ...dtoMapped, user });
  } else {
    Object.assign(direccion, dtoMapped);
  }

  return this.direccionRepository.save(direccion);
}




}



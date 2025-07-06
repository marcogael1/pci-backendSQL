import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyProfile } from '../schemas/companyProfile.schema';

@Injectable()
export class CompanyProfileService {
  constructor(
    @InjectRepository(CompanyProfile)
    private companyProfileRepository: Repository<CompanyProfile>,
  ) {}

  async create(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const createdCompanyProfile = this.companyProfileRepository.create(data);
    return await this.companyProfileRepository.save(createdCompanyProfile);
  }

  async findOne(): Promise<CompanyProfile> {
    const profile = await this.companyProfileRepository.findOne({
      where: { id: 1 }, // Buscar el registro con id igual a 1
    });

    if (!profile) {
      throw new NotFoundException('Perfil de empresa no encontrado');
    }
    return profile;
  }

  async update(data: any): Promise<CompanyProfile> {
    const existingProfile = await this.companyProfileRepository.findOne({});
    if (!existingProfile) {
      throw new NotFoundException('Perfil de empresa no encontrado');
    }
    Object.assign(existingProfile, data);
    return await this.companyProfileRepository.save(existingProfile);
  }

  async delete(): Promise<void> {
    const deletedProfile = await this.companyProfileRepository.findOne({});
    if (!deletedProfile) {
      throw new NotFoundException('Perfil de empresa no encontrado');
    }
    await this.companyProfileRepository.remove(deletedProfile);
  }
}

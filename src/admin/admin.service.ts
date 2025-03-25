import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Information } from '../schemas/information.schema';  

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Information)
    private informationRepository: Repository<Information>,
  ) {}

  async create(informationData: Partial<Information>): Promise<Information> {
    const lastDocument = await this.informationRepository
      .createQueryBuilder('information')
      .where('information.title = :title', { title: informationData.title })
      .andWhere('information.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('information.version', 'DESC')
      .getOne();

    let newVersion = '1.0';

    if (lastDocument) {
      const lastVersion = lastDocument.version;
      const versionParts = lastVersion.split('.');

      const majorVersion = parseInt(versionParts[0], 10) + 1;
      newVersion = `${majorVersion}.0`;
    }

    const newDocument = this.informationRepository.create({
      ...informationData,
      version: newVersion,
    });

    return await this.informationRepository.save(newDocument);
  }

  async findAllDeleted(): Promise<Information[]> {
    return await this.informationRepository.find({ where: { isDeleted: true } });
  }

  async findAll(): Promise<Information[]> {
    return await this.informationRepository.find();
  }

  async findOne(id: string): Promise<Information | null> {
    const numericId = parseInt(id, 10); 
    return await this.informationRepository.findOne({ where: { id: numericId } });
  }
  

  async update(id: string, informationData: Partial<Information>): Promise<Information | null> {
    await this.informationRepository.update(id, informationData);
    return this.findOne(id);  
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.informationRepository.update(id, { isDeleted: true });
    return result.affected ? true : false;
  }

  async setAsCurrentVersion(documentId: string): Promise<Information | null> {
    const idNumber = Number(documentId);
  
    const newCurrentDocument = await this.informationRepository.findOne({ where: { id: idNumber } });
    if (!newCurrentDocument) {
      throw new NotFoundException('Documento no encontrado');
    }
  
    await this.informationRepository
      .createQueryBuilder()
      .update(Information)
      .set({ isCurrentVersion: false })
      .where('title = :title', { title: newCurrentDocument.title })
      .andWhere('isCurrentVersion = :isCurrentVersion', { isCurrentVersion: true })
      .execute();
  
    newCurrentDocument.isCurrentVersion = true;
    return await this.informationRepository.save(newCurrentDocument);
  }
  
}

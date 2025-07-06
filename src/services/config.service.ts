import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../schemas/config.schema';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectRepository(AppConfig)
    private appConfigRepository: Repository<AppConfig>,
  ) {}

  async getAllConfig(): Promise<AppConfig> {
    const config = await this.appConfigRepository.findOne({
      where: {},
    });

    if (!config) {
      throw new NotFoundException('Configuración no encontrada');
    }
    return config;
  }

  async updateMaxLoginAttempts(newAttempts: number): Promise<AppConfig> {
    const config = await this.appConfigRepository.findOne({});
    if (!config) {
      throw new NotFoundException('Configuración no encontrada');
    }
    config.maxLoginAttempts = newAttempts;
    return await this.appConfigRepository.save(config);
  }

  async updateVerificationEmailMessage(newMessage: string): Promise<AppConfig> {
    const config = await this.appConfigRepository.findOne({});
    if (!config) {
      throw new NotFoundException('Configuración no encontrada');
    }
    config.verificationEmailMessage = newMessage;
    return await this.appConfigRepository.save(config);
  }

  async updateVerificationTokenExpiry(newExpiry: number): Promise<AppConfig> {
    const config = await this.appConfigRepository.findOne({});
    if (!config) {
      throw new NotFoundException('Configuración no encontrada');
    }
    config.verificationTokenExpiry = newExpiry;
    return await this.appConfigRepository.save(config);
  }
}

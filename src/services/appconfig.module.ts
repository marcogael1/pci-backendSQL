import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from './config.service';
import { AppConfig } from '../schemas/config.schema';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfig])],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}

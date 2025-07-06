import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from 'src/category/category.module';
import { LogsModule } from 'src/services/logs.module';
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from 'src/schemas/user.schema';
import { Direccion } from 'src/schemas/address.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        User,
        Direccion
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule { }

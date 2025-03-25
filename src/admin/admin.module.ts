import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';  
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Information } from '../schemas/information.schema';  

@Module({
  imports: [
    TypeOrmModule.forFeature([Information]),  
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

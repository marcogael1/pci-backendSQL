import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/services/appconfig.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from 'src/schemas/user.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AppConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

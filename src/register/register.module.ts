import { Module } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';
import { User } from '../schemas/user.schema';
import { EmailService } from '../services/email.service';
import { AppConfigModule } from 'src/services/appconfig.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsModule } from 'src/services/logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AppConfigModule, LogsModule],
  controllers: [RegisterController],
  providers: [RegisterService, EmailService],
  exports: [RegisterService],
})
export class RegisterModule {}

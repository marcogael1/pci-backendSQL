import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LogsModule } from '../services/logs.module';
import { AppConfigModule } from 'src/services/appconfig.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../schemas/user.schema';
import { TwilioModule } from 'src/admin/twilio/twilio.module';
import { TwilioService } from 'src/admin/twilio/twilio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    LogsModule,
    AppConfigModule,
    TwilioModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, TwilioService],
  exports: [AuthService],
})
export class AuthModule {}

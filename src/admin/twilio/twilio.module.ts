import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';  
import { TwilioService } from './twilio.service';
import { User } from '../../schemas/user.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Asegúrate de que el repositorio de User esté aquí
  ],
  providers: [
    TwilioService,
  ],
  exports: [TwilioService],  // Exportamos TwilioService para ser usado en otros módulos
})
export class TwilioModule {}

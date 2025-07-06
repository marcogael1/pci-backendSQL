import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { LogService } from './services/logs.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  const logService = app.get(LogService);
  app.useGlobalFilters(new GlobalExceptionFilter(logService));
  await app.listen(3000, '0.0.0.0');
  console.log('Servidor corriendo en http://localhost:3000');
  console.log('Accessible from emulator at http://10.0.2.2:3000');
}

bootstrap();

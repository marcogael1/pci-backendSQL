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
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en el puerto ${port}`);
}

bootstrap();

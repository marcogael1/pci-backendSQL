import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}
  
  use(req: Request, res: Response, next: NextFunction) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    // ✅ ORÍGENES PERMITIDOS - Incluye múltiples URLs
    const allowedOrigins = [
      frontendUrl, // http://localhost:4200
      'http://localhost:3000', // Para pruebas locales
      'http://10.0.2.2:3000', // Para emulador Android
      'http://192.168.0.112:3000', // Para dispositivos físicos en tu red
    ];
    
    const origin = req.headers.origin;
    
    // ✅ VERIFICAR SI EL ORIGEN ESTÁ PERMITIDO
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      // Para desarrollo, también permitir orígenes null (apps nativas)
      res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, Authorization, Content-Disposition',
    );
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  }
}
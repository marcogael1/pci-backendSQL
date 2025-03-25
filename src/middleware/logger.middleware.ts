import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/logs.service';
import { DateTime } from 'luxon';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logService: LogService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = DateTime.now();
    const { method, url, ip, headers } = req;

    // Obtener usuario desde req.user
    let userInfo = 'Usuario no autenticado';
    if (req.user) {
      userInfo = `Usuario: ${req.user.email} (ID: ${req.user.id}, Rol: ${req.user.role})`;
    }

    // Capturar el evento de finalización de la respuesta
    res.on('finish', async () => {
      const responseTime = DateTime.now().diff(startTime, 'milliseconds').milliseconds;
      const statusCode = res.statusCode;

      // Información adicional en caso de error 403
      const errorDetails = statusCode === 403 ? {
        message: 'Acceso denegado',
        attemptedUrl: url,
        user: userInfo,
        ip,
        userAgent: headers['user-agent'],
        referer: headers['referer']
      } : null;

      // Construcción del mensaje de log con correo electrónico
      const logMessage = `[${DateTime.now().toISO()}] ${method} ${url} ${statusCode} - ${responseTime}ms - IP: ${ip} - ${userInfo}` + 
        (errorDetails ? ` - ERROR: ${JSON.stringify(errorDetails)}` : '');

      // Guardar en la base de datos o archivo
      await this.logService.createLog(logMessage);
    });

    next();
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';
import { ValidationError } from 'class-validator';
import { LogService } from '../services/logs.service';
import * as jwt from 'jsonwebtoken';

interface User {
  id: number;
  email: string;
  role: string;
}
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logService: LogService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorType = 'UnknownError';

    // Usuario
    // Intentar extraer usuario desde la cookie (sin necesidad de guard)
    let user: User | null = null;
    try {
      const token = request.cookies?.jwt;
      if (token) {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.userId && decoded?.email && decoded?.role) {
          user = {
            id: Number(decoded.userId),
            email: decoded.email,
            role: decoded.role,
          };
        }
      }
    } catch (err) {}

    const clientIp = getClientIp(request);

    // Tipo de error
    if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Error en la consulta: ${exception.message}`;
      errorType = 'QueryFailedError';
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Entidad no encontrada';
      errorType = 'EntityNotFoundError';
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Error en TypeORM: ${exception.message}`;
      errorType = 'TypeORMError';
    } else if (
      Array.isArray(exception) &&
      exception[0] instanceof ValidationError
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'Error de validación en la entrada de datos';
      errorType = 'ValidationError';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorType = 'HttpException';
    } else {
      message = exception.message || 'Error desconocido';
      errorType = exception.constructor?.name || 'UnknownError';
    }

    const logLevel = getLogLevel(status);

    await this.logService.createLog(
      `[${errorType}] ${message}`,
      logLevel,
      user,
      request.url,
      clientIp,
    );

    // Respuesta al frontend
    response.status(status).json({
      statusCode: status,
      errorType,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  let ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded ?? request.socket.remoteAddress) || '';

  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

function getLogLevel(status: number): 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' {
  if (status >= 500) return 'CRITICAL';
  if (status >= 400 && status < 500) return 'ERROR';
  if (status >= 300 && status < 400) return 'WARN';
  return 'INFO';
}

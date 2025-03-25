import { ExceptionFilter, Catch, ArgumentsHost, HttpException, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';
import { ValidationError } from 'class-validator';
import { LogService } from '../services/logs.service';

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

    // 🔍 Obtener datos del usuario autenticado (si existe)
    let userInfo = 'Usuario no autenticado';
    if (request.user) {
      userInfo = `Usuario: ${request.user.email} (ID: ${request.user.id}, Rol: ${request.user.role})`;
    }

    // 🔥 TypeORM: Error en consultas a la BD
    if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Error en la consulta: ${(exception as QueryFailedError).message}`;
      errorType = 'TypeORM QueryFailedError';
    } 
    else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Entidad no encontrada';
      errorType = 'TypeORM EntityNotFoundError';
    } 
    else if (exception instanceof TypeORMError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Error en TypeORM: ${exception.message}`;
      errorType = 'TypeORMError';
    } 
    // 🔥 Class-Validator: Error de validación en DTOs
    else if (Array.isArray(exception) && exception[0] instanceof ValidationError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'Error de validación en la entrada de datos';
      errorType = 'ValidationError';
    } 
    // 🔥 HTTP Exception: Errores personalizados (como 401, 403, 404, etc.)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorType = 'HttpException';
    } 
    // ❗ Error desconocido
    else {
      message = exception.message || 'Error desconocido';
      errorType = exception.constructor?.name || 'UnknownError';
    }

    // 📌 Registrar el error en la base de datos con información del usuario
    const logMessage = `[${errorType}] ${message} - Ruta: ${request.url} - ${userInfo}`;
    await this.logService.createLog(logMessage);

    // 📌 Enviar la respuesta JSON al frontend
    response.status(status).json({
      statusCode: status,
      errorType: errorType,
      message: message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

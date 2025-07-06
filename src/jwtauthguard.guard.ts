import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

// Definir la interfaz User dentro del mismo archivo
interface User {
  id: string;
  email: string;
  role: string;
}
// Extender la interfaz Request de Express para incluir req.user
declare module 'express' {
  interface Request {
    user?: User;
  }
}
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.jwt;

    if (!token) {
      throw new UnauthorizedException('No hay token en la cookie.');
    }

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId || !decoded.email) {
        throw new UnauthorizedException(
          'Token inválido (Faltan datos del usuario).',
        );
      }

      // Inyectar usuario con email en req.user
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      } as User;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}

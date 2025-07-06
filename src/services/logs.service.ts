import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../schemas/logs.schema';
import * as path from 'path';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

const rfs =
  require('rotating-file-stream') as typeof import('rotating-file-stream');

@Injectable()
export class LogService {
  private logStream: import('rotating-file-stream').RotatingFileStream;

  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {
    const logPath = path.join(__dirname, '../../logs');

    // 📁 Crear carpeta de logs si no existe
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
    this.logStream = rfs.createStream(
      (time, index) => {
        if (!time) time = new Date();
        const logDate =
          typeof time === 'number'
            ? DateTime.fromMillis(time)
            : DateTime.fromJSDate(time);
        const formatted = logDate.toFormat('yyyy-MM-dd');
        return `operations-${formatted}.log`;
      },
      {
        interval: '1d',
        path: path.join(__dirname, '../../logs'),
        maxFiles: 30,
      },
    );

    this.logStream.on('open', () => {
      console.log('✅ Log stream inicializado correctamente');
    });
  }

  async createLog(
    content: string,
    level: 'INFO' | 'WARN' | 'CRITICAL' | 'ERROR' = 'ERROR',
    user?: { email: string; id: number; role: string },
    routePath?: string,
    ip?: string,
  ) {
    const currentDateTime = DateTime.now().setZone('America/Mexico_City');
    const formattedDateTime = currentDateTime.toFormat('yyyy-MM-dd HH:mm:ss');

    const logData = {
      timestamp: formattedDateTime,
      level,
      user: user
        ? `${user.email} (ID: ${user.id}, Rol: ${user.role})`
        : 'No autenticado',
      path: routePath || 'No especificada',
      ip: ip || 'No disponible',
      message: content,
    };

    // 📝 Guardar en la base de datos (descomenta si lo deseas)
    /*
    const newLog = this.logRepository.create({
      dateTime: currentDateTime.toJSDate(),
      content: JSON.stringify(logData),
    });
    await this.logRepository.save(newLog);
    */

    // 🧾 Escribir en archivo
    this.writeToFile(logData);
  }

  async getLogs(): Promise<Log[]> {
    return await this.logRepository.find({ order: { dateTime: 'DESC' } });
  }

  private writeToFile(logData: any): void {
    try {
      const entry = JSON.stringify(logData) + '\n';
      this.logStream.write(entry);
    } catch (error) {
      console.error('❌ Error al escribir en archivo de logs:', error);
    }
  }
}

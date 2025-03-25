import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../schemas/logs.schema';
import * as fs from 'fs';
import * as path from 'path';
import { DateTime } from 'luxon'; 

@Injectable()
export class LogService {
  private logFilePath: string;

  constructor(
    @InjectRepository(Log)
    private readonly  logRepository: Repository<Log>,
  ) {
    this.logFilePath = path.join(__dirname, '../../logs/operations.log'); 
  }

  async createLog(content: string){
    const currentDateTime = DateTime.now().setZone('America/Mexico_City');
    const formattedDateTime = currentDateTime.toFormat("yyyy-MM-dd HH:mm:ss");
    const logEntry = `[${formattedDateTime}] ERROR: ${content}\n`;
    const newLog = this.logRepository.create({ dateTime: currentDateTime.toJSDate(), content });
    this.writeToFile(logEntry);
  }

  async getLogs(): Promise<Log[]> {
    return await this.logRepository.find({ order: { dateTime: 'DESC' } });
  }

  private writeToFile(logEntry: string): void {
    try {
      fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

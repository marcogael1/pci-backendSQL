import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('app_config')
export class AppConfig extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts: number;

  @Column({ type: 'text', default: 'Gracias por registrarte en nuestra aplicación.' })
  verificationEmailMessage: string;

  @Column({ type: 'int', default: 15 })
  verificationTokenExpiry: number;
}

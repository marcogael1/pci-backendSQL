// src/notifications/entities/notification.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.schema';
import { ProductDetails } from './productos.schema';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'is_read', default: false }) // 👈 Coincide con la BD
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' }) // 👈 Coincide con la BD
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // 👈 Coincide con la BD
  user: User;

  @ManyToOne(() => ProductDetails, (product) => product.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' }) // 👈 Coincide con la BD
  product: ProductDetails;
}

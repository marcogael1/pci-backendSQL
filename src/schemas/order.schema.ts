import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.schema';
import { Direccion } from './address.schema';
import { OrderItem } from './order-item.schema';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.orders, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Direccion, address => address.orders, { eager: true })
  @JoinColumn({ name: 'address_id' }) // <- explícitamente defines la FK
  address: Direccion;


  @Column('numeric', { precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'paid', 'cancelled', etc.

  @Column({ nullable: true })
  payment_method: string; // e.g., 'paypal'

  @Column({ nullable: true, type: 'text' })
  payment_reference: string; // PayPal transaction ID or token

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

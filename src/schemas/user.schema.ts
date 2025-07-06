import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Review } from './review.schema';
import { CartItem } from './cart-item.schema';
import { Direccion } from './address.schema';
import { Favorite } from './favorites.schema';
import { Order } from './order.schema';
import { Notification } from './notification.schema';
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 50, default: 'cliente' })
  type: string;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockUntil: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mfaExpires: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpires: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordChange: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verificationToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiry?: Date;

  @Column('jsonb', { default: [] })
  blockedHistory: { date: Date }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[]; // ⬅️ Agregamos la relación con Review

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
  cartItems: CartItem[]; // 🔹 Debe llamarse 'cartItems' para que coincida con CartItem.user

  @Column({ type: 'varchar', length: 255 })
  cellPhone: string;

  @Column()
  birthDate: Date;

  @Column({ type: 'varchar', length: 255 })
  surnames: string;

  @OneToMany(() => Direccion, direccion => direccion.user)
  direcciones: Direccion[];

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

}

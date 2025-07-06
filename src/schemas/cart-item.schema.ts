import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.schema';
import { ProductDetails } from './productos.schema';

@Entity('cart_items') // Nombre correcto de la tabla
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.cartItems, {
    nullable: true,
    onDelete: 'CASCADE',
  }) // 🔥 Permitir null
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => ProductDetails, (product) => product.cartItems)
  @JoinColumn({ name: 'product_id' }) // Asegúrate de que en la BD la columna sea 'product_id'
  product: ProductDetails;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ name: 'guest_id', type: 'varchar', length: 50, nullable: true }) // 🔥 Nombre explícito en la BD
  guestId: string | null;
}

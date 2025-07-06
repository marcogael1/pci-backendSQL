import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.schema';
import { ProductDetails } from './productos.schema';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' }) // <- nombre de la columna en la tabla
  order: Order;
  
  @ManyToOne(() => ProductDetails, { eager: true })
  @JoinColumn({ name: 'product_id' }) // <- nombre de la columna en la tabla
  product: ProductDetails;

  @Column()
  quantity: number;

  @Column('numeric', { precision: 10, scale: 2 })
  unit_price: number;

  @Column('numeric', { precision: 10, scale: 2 })
  subtotal: number;
}

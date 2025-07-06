import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.schema';
import { ProductDetails } from './productos.schema'; // Asegúrate de tener este archivo y entidad definidos

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ProductDetails, product => product.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductDetails;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProductDetails } from './productos.schema';

@Entity('colors')
export class Color {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7 })
  hex_code: string;

  @OneToMany(() => ProductDetails, (product) => product.color_id)
  products: ProductDetails[];
}

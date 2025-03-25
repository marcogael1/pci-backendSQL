import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProductDetails } from './productos.schema';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  country: string;

  @Column({ type: 'varchar', length: 500 })
  website: string;

  @OneToMany(() => ProductDetails, (product) => product.brand)
  products: ProductDetails[];
}

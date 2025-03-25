import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductDetails } from './productos.schema';

@Entity('product_specifications')
export class ProductSpecification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  @Column()
  title: string; // Nombre de la especificación (ejemplo: "Resolución", "Brillo", etc.)

  @Column()
  specification: string; // Valor de la especificación (ejemplo: "1080p", "3000 lúmenes", etc.)

  @Column()
  category_name: string;

  @ManyToOne(() => ProductDetails, (product) => product.specifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductDetails;
}

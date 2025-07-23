import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ProductDetails } from './productos.schema';
import { Filter } from './filters.schema';

@Entity('product_filters')
export class ProductFilter {
  @PrimaryGeneratedColumn()
  id: number;
   @Column()
  product_id: number;
  @ManyToOne(() => ProductDetails, (product) => product.productFilters)
  @JoinColumn({ name: 'product_id' })
  product: ProductDetails;

  @ManyToOne(() => Filter, (filter) => filter.products)
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;

  @Column()
  value: string;  // El valor asociado a este filtro para el producto
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Subcategory } from './subcategory.schema';
import { ProductDetails } from './productos.schema';
import { ProductFilter } from './productFilters.schema';
import { SubcategoryFilter } from './subcategory_filters.schema';

@Entity('filters')
export class Filter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.filters)
  subcategories: Subcategory[];

  @ManyToMany(() => ProductDetails, (product) => product.filters)
  products: ProductDetails[];

  @OneToMany(() => ProductFilter, (productFilter) => productFilter.filter)
  productFilters: ProductFilter[];

  @OneToMany(() => SubcategoryFilter, (sf) => sf.filter)
  subcategoryFilters: SubcategoryFilter[];
}


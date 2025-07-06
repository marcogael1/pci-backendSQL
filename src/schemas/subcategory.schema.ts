import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Category } from './category.schema';
import { ProductDetails } from './productos.schema';
import { Filter } from './filters.schema';
@Entity('subcategories')
export class Subcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => Category, (category) => category.subcategories)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductDetails, (product) => product.subcategory)
  products: ProductDetails[];

  @ManyToMany(() => Filter, (filter) => filter.subcategories)
  @JoinTable({
    name: 'subcategory_filters', // Nombre de la tabla intermedia
    joinColumn: { name: 'subcategory_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'filter_id', referencedColumnName: 'id' },
  })
  filters: Filter[];
}

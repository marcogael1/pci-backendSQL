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
import { SubcategoryFilter } from './subcategory_filters.schema';
@Entity('subcategories')
export class Subcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string; // <- AGREGAR ESTO

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

  @OneToMany(() => SubcategoryFilter, (sf) => sf.subcategory)
subcategoryFilters: SubcategoryFilter[];
}

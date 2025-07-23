import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Subcategory } from './subcategory.schema';
import { Filter } from './filters.schema';

@Entity('subcategory_filters')
export class SubcategoryFilter {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.subcategoryFilters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Subcategory;

  @ManyToOne(() => Filter, (filter) => filter.subcategoryFilters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}

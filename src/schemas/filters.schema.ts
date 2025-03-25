import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,ManyToMany } from 'typeorm';
import { Subcategory } from './subcategory.schema';

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
}

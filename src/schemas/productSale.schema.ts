import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('product_sales')
export class ProductSale extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ type: 'int' })
  quantity_sold: number;

  @Column({ type: 'date' })
  sale_date: Date;
}

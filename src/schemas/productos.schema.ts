import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Subcategory } from './subcategory.schema';
import { Brand } from './brand.schema';
import { Review } from './review.schema';
import { CartItem } from './cart-item.schema';
import { ProductSpecification } from './product_specifications.schema';
import { Category } from './category.schema';
import { Filter } from './filters.schema';
import { ProductFilter } from './productFilters.schema';
import { Favorite } from './favorites.schema';
import { OrderItem } from './order-item.schema';
import { Notification } from './notification.schema';
@Entity('products')
export class ProductDetails {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int' })
  category_id: number;

  @Column({ type: 'int', nullable: true })
  brand_id: number;

  @Column({ type: 'int', nullable: true })
  color_id: number;

  @Column({ type: 'varchar', length: 500 })
  image_url: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.products)
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Subcategory;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand; // Relación con la marca

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => ProductSpecification, (spec) => spec.product)
  specifications: ProductSpecification[];

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // Agregar la relación ManyToMany con Filter
  @ManyToMany(() => Filter, (filter) => filter.products)
  filters: Filter[]; // Esta es la propiedad que faltaba

  // Relación con los filtros
  @OneToMany(() => ProductFilter, (productFilter) => productFilter.product)
  productFilters: ProductFilter[];  // Relación con la tabla intermedia

  @OneToMany(() => Favorite, favorite => favorite.product)
  favorites: Favorite[];

  @OneToMany(() => OrderItem, item => item.product)
  orderItems: OrderItem[];

  @OneToMany(() => Notification, (notification) => notification.product)
  notifications: Notification[];

}

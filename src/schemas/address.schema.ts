import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.schema';
import { Order } from './order.schema';


@Entity('addresses')
export class Direccion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.direcciones)
  @JoinColumn({ name: 'user_id' }) // o el nombre correcto de la columna FK
  user: User;

  @Column({ length: 100 })
  estado: string;

  @Column({ length: 100 })
  municipio: string;

  @Column({ length: 100 })
  colonia: string;

  @Column({ length: 200 })
  calle: string;

  @Column({ length: 20, nullable: true })
  numero: string;

  @Column({ length: 10 })
  codigo_postal: string;

  @Column({ length: 300, nullable: true })
  referencias: string;

  @OneToMany(() => Order, order => order.address)
  orders: Order[];

}

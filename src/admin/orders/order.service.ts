import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from '../../schemas/order-item.schema';
import { Order } from '../../schemas/order.schema';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
  ) {}

async findAll() {
  const orders = await this.orderRepo.find({
    relations: ['user', 'address', 'items', 'items.product'],
    order: { created_at: 'DESC' },
  });

  return orders.map(order => ({
    id: order.id,
    total: order.total,
    status: order.status,
    payment_method: order.payment_method,
    payment_reference: order.payment_reference,
    created_at: order.created_at,
    updated_at: order.updated_at,

    user: {
      id: order.user.id,
      username: order.user.username,
      surnames: order.user.surnames,
      email: order.user.email,
      cellphone: order.user.cellPhone, // O asegúrate del nombre exacto en tu schema
    },

    address: {
      id: order.address.id,
      estado: order.address.estado,
      municipio: order.address.municipio,
      colonia: order.address.colonia,
      calle: order.address.calle,
      numero: order.address.numero,
      codigo_postal: order.address.codigo_postal,
      referencias: order.address.referencias,
    },

    items: order.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        stock: item.product.stock,
        category_id: item.product.category_id,
        brand_id: item.product.brand_id,
        color_id: item.product.color_id,
        image_url: item.product.image_url,
        created_at: item.product.created_at,
        updated_at: item.product.updated_at,
      }
    }))
  }));
}


  async findItemsByOrderId(orderId: number) {
    return this.itemRepo.find({
      where: { order: { id: orderId } },
      relations: ['product'],
    });
  }

  async updateStatus(orderId: number, status: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    order.status = status;
    return this.orderRepo.save(order);
  }
}

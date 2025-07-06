import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../schemas/cart-item.schema';
import { User } from '../schemas/user.schema';
import { ProductDetails } from '../schemas/productos.schema';
import { Direccion } from 'src/schemas/address.schema';
import { Favorite } from 'src/schemas/favorites.schema';
import { Order } from 'src/schemas/order.schema';
import { Notification } from 'src/schemas/notification.schema';
import { OrderItem } from 'src/schemas/order-item.schema';
import * as nodemailer from 'nodemailer';
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private cartRepository: Repository<CartItem>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Direccion)
    private direccionRepository: Repository<Direccion>,
    @InjectRepository(ProductDetails)
    private productRepository: Repository<ProductDetails>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>
  ) { }

  async getFavoritesByUserId(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const favorites = await this.favoriteRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });

    return favorites.map(fav => ({
      productId: fav.product.id,
      productName: fav.product.name,
      price: fav.product.price,
      imageUrl: fav.product.image_url,
    }));
  }

  async getCart(userId: number | null, guestId: string | null) {
    const cartItems = await this.cartRepository.find({
      where: userId ? { user: { id: userId } } : { guestId },
      relations: ['product'],
    });

    return cartItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      stock: item.product.stock,
      price: item.product.price,
      quantity: item.quantity,
      imageUrl: item.product.image_url,
    }));
  }

  async addToCart(
    userId: number | null,
    guestId: string | null,
    productId: number,
    quantity: number,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const existingItem = await this.cartRepository.findOne({
      where: userId
        ? { user: { id: userId }, product: { id: productId } }
        : { guestId, product: { id: productId } },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      return this.cartRepository.save(existingItem);
    } else {
      const newItem = this.cartRepository.create({
        user: userId ? { id: userId } : null,
        guestId: userId ? null : guestId,
        product,
        quantity,
      });

      return this.cartRepository.save(newItem);
    }
  }

  async migrateGuestCart(userId: number, guestId: string | null) {
    if (!guestId) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const guestCartItems = await this.cartRepository.find({
      where: { guestId },
      relations: ['product'],
    });

    for (const item of guestCartItems) {
      const existingItem = await this.cartRepository.findOne({
        where: { user: { id: userId }, product: { id: item.product.id } },
      });

      if (existingItem) {
        existingItem.quantity += item.quantity;
        await this.cartRepository.save(existingItem);
      } else {
        item.user = user;
        item.guestId = null;
        await this.cartRepository.save(item);
      }
    }
  }


  // Verifica si el usuario tiene direcciones
  async verificarDireccionPorUsuario(usuarioId: number): Promise<boolean> {
    const direcciones = await this.direccionRepository.find({
      where: { user: { id: usuarioId } },
    });

    return direcciones.length > 0;
  }

  async getOrdersByUserId(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'address'],
      order: { created_at: 'DESC' },
    });

    return orders.map(order => ({
      orderId: order.id,
      status: order.status,
      totalAmount: order.total,
      createdAt: order.created_at,
      shippingAddress: order.address,
      items: order.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.image_url,
      })),
    }));
  }

  async findByUserId(userId: number) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOrder(data: any, userId: number): Promise<Order> {
    const user = await this.userRepository.findOneBy({ id: userId });
    const direccion = await this.direccionRepository.findOneBy({ id: data.direccion.id });

    const order = this.orderRepository.create({
      user,
      address: direccion,
      total: data.total,
      payment_method: data.metodoPago || 'paypal',
      status: 'pending',
      payment_reference: data.paypalTransactionId || null,
      items: [],
    });

    for (const prod of data.productos) {
      const product = await this.productRepository.findOneBy({ id: prod.productId });

      const item = this.orderItemRepository.create({
        product,
        quantity: prod.quantity,
        unit_price: Number(prod.price),
        subtotal: Number(prod.quantity) * Number(prod.price),
      });

      order.items.push(item);
    }

    const savedOrder = await this.orderRepository.save(order);

    // Enviar correo con los datos de la orden
    await this.sendOrderEmail(savedOrder, user.email);
    await this.cartRepository.delete({ user: { id: userId } });
    return savedOrder;
  }


  private async sendOrderEmail(order: Order, toEmail: string) {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; color: #374151; font-weight: 500;">${item.product.name}</td>
      <td style="padding: 12px 16px; text-align: center; color: #6b7280;">${item.quantity}</td>
      <td style="padding: 12px 16px; text-align: right; color: #6b7280;">$${item.unit_price.toFixed(2)}</td>
      <td style="padding: 12px 16px; text-align: right; color: #0057D9; font-weight: 600;">$${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Pedido - Pci Tecnologia</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0057D9 0%, #003d99 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
            PCI TECNOLOGIA
          </h1>
          <p style="color: #b3d1ff; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">
            Tecnología que conecta
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- Welcome Section -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 28px; font-weight: 600;">
              ¡Gracias por tu compra, ${order.user.username}!
            </h2>
            <p style="color: #6b7280; margin: 0; font-size: 18px; line-height: 1.5;">
              Tu pedido ha sido registrado exitosamente y está siendo procesado.
            </p>
          </div>

<!-- Order Info Card -->
<div style="background: linear-gradient(135deg, #f8fafc 0%, #e8f4fd 100%); border: 2px solid #0057D9; border-radius: 16px; padding: 30px; margin-bottom: 35px;">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
    <div style="text-align: center;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">ID del Pedido</p>
      <p style="margin: 0; color: #0057D9; font-size: 20px; font-weight: 700;">#${order.id}</p>
    </div>
    <div style="text-align: center;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Método de Pago</p>
      <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${order.payment_method}</p>
    </div>
  </div>
  
  <!-- Desglose de costos -->
  <div style="background-color: rgba(255, 255, 255, 0.7); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(0, 87, 217, 0.2);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <span style="color: #374151; font-size: 16px; font-weight: 500;">Subtotal: </span>
      <span style="color: #1f2937; font-size: 18px; font-weight: 600;">$${(order.total - 100).toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <span style="color: #374151; font-size: 16px; font-weight: 500;">Envío: </span>
      <span style="color: #059669; font-size: 18px; font-weight: 600;">$100.00</span>
    </div>
    <div style="border-top: 2px solid #0057D9; padding-top: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #0057D9; font-size: 18px; font-weight: 700;">Total: </span>
        <span style="color: #0057D9; font-size: 24px; font-weight: 800;">$${order.total.toFixed(2)}</span>
      </div>
    </div>
  </div>
  
  <!-- Total destacado -->
  <div style="background-color: #0057D9; color: #FFFFFF; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0, 87, 217, 0.3);">
    <p style="margin: 0 0 8px 0; font-size: 16px; opacity: 0.9; font-weight: 500;">Total del Pedido</p>
    <p style="margin: 0; font-size: 36px; font-weight: 800; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">$${order.total.toFixed(2)}</p>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8; font-weight: 400;">*Envío incluido</p>
  </div>
</div>

          <!-- Products Section -->
          <div style="margin-bottom: 35px;">
            <h3 style="color: #0057D9; margin: 0 0 25px 0; font-size: 22px; font-weight: 700; border-bottom: 3px solid #0057D9; padding-bottom: 10px;">
              📦 Resumen del Pedido
            </h3>
            
            <div style="overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse; background-color: #FFFFFF;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #0057D9 0%, #003d99 100%);">
                    <th style="padding: 18px 16px; text-align: left; color: #FFFFFF; font-weight: 700; font-size: 16px;">Producto</th>
                    <th style="padding: 18px 16px; text-align: center; color: #FFFFFF; font-weight: 700; font-size: 16px;">Cantidad</th>
                    <th style="padding: 18px 16px; text-align: right; color: #FFFFFF; font-weight: 700; font-size: 16px;">Precio Unitario</th>
                    <th style="padding: 18px 16px; text-align: right; color: #FFFFFF; font-weight: 700; font-size: 16px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #e8f4fd 100%); border-left: 6px solid #0057D9; padding: 25px; border-radius: 0 12px 12px 0; margin-bottom: 35px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h3 style="color: #0057D9; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
              <span style="margin-right: 10px; font-size: 24px;">📍</span>
              Dirección de Envío
            </h3>
            <div style="background-color: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.8;">
                <strong style="color: #0057D9;">CP:</strong> ${order.address.codigo_postal}<br>
                <strong style="color: #0057D9;">Estado:</strong> ${order.address.estado}<br>
                <strong style="color: #0057D9;">Municipio:</strong> ${order.address.municipio}<br>
                <strong style="color: #0057D9;">Colonia:</strong> ${order.address.colonia}<br>
                <strong style="color: #0057D9;">Calle:</strong> ${order.address.calle}<br>
                <strong style="color: #0057D9;">Referencias:</strong> ${order.address.referencias}
              </p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%); border: 2px solid #bfdbfe; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
            <h3 style="color: #0057D9; margin: 0 0 20px 0; font-size: 18px; font-weight: 700;">
              🚀 Próximos Pasos
            </h3>
            <ul style="margin: 0; padding-left: 25px; color: #374151; font-size: 16px; line-height: 1.6;">
              <li style="margin-bottom: 10px;">Puedes rastrear tu pedido con el ID proporcionado, en la seccion de tu perfil</li>
              <li>El tiempo estimado de entrega es de 3-5 días hábiles</li>
            </ul>
          </div>

          <!-- Thank You Message -->
          <div style="text-align: center; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">
              Este correo es una confirmación automática.<br>
              <strong style="color: #0057D9;">¡Gracias por confiar en nosotros!</strong>
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 35px 30px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <h4 style="color: #FFFFFF; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">PCI TECNOLOGIA</h4>
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">Tecnología que conecta</p>
          </div>
          
          <div style="border-top: 1px solid #374151; padding-top: 20px;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              © 2024 Pci Tecnologia. Todos los derechos reservados.
            </p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Confirmación de tu pedido',
      html,
    });
  }


  async removeFromCart(userId: number | null, guestId: string | null, productId: number) {
    const item = await this.cartRepository.findOne({
      where: userId
        ? { user: { id: userId }, product: { id: productId } }
        : { guestId, product: { id: productId } },
    });

    if (!item) throw new NotFoundException('Producto no encontrado en el carrito.');

    await this.cartRepository.remove(item);
    return { message: 'Producto eliminado del carrito.' };
  }


  async clearCart(userId: number | null, guestId: string | null) {
    const items = await this.cartRepository.find({
      where: userId ? { user: { id: userId } } : { guestId },
    });

    await this.cartRepository.remove(items);
    return { message: 'Carrito vaciado con éxito.' };
  }

  async updateQuantity(userId: number | null, guestId: string | null, productId: number, quantity: number) {
    if (quantity < 1) throw new BadRequestException('La cantidad debe ser al menos 1');

    const item = await this.cartRepository.findOne({
      where: userId
        ? { user: { id: userId }, product: { id: productId } }
        : { guestId, product: { id: productId } },
      relations: ['product'],
    });

    if (!item) throw new NotFoundException('Producto no encontrado en el carrito.');

    if (quantity > item.product.stock) {
      throw new BadRequestException('Cantidad supera el stock disponible.');
    }

    item.quantity = quantity;
    await this.cartRepository.save(item);
    return { message: 'Cantidad actualizada correctamente' };
  }

}

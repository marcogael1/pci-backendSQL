import { CartService } from './cart.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { User } from 'src/schemas/user.schema';
import { CartItem } from 'src/schemas/cart-item.schema';
import { ProductDetails } from 'src/schemas/productos.schema';
import { CartController } from './cart.controller';
import { JwtService } from '@nestjs/jwt';
import { Direccion } from 'src/schemas/address.schema';
import { Favorite } from 'src/schemas/favorites.schema';
import { Order } from 'src/schemas/order.schema';
import { OrderItem } from 'src/schemas/order-item.schema';
import { Notification } from 'src/schemas/notification.schema';
@Module({
  imports: [TypeOrmModule.forFeature([User, CartItem, ProductDetails, Direccion, Favorite, Order, OrderItem, Notification])],
  controllers: [CartController],
  providers: [CartService, JwtService],
})
export class CartModule {}


import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Order } from '../../schemas/order.schema';
import { OrderItem } from '../../schemas/order-item.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  controllers: [OrderController],
  providers: [OrderService, JwtService],
})
export class OrderModule {}

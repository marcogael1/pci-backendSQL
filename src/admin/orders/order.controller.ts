import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../jwtauthguard.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getAllOrders(@Req() req: Request) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos para ver los pedidos.');
    }
    return await this.orderService.findAll();
  }

  @Get(':id/items')
  async getOrderItems(@Param('id') id: number, @Req() req: Request) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos para ver los productos del pedido.');
    }
    return await this.orderService.findItemsByOrderId(id);
  }

  @Patch(':id')
  async updateOrderStatus(
    @Param('id') id: number,
    @Body() body: { status: string },
    @Req() req: Request,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos para actualizar el estado del pedido.');
    }
    return await this.orderService.updateStatus(id, body.status);
  }
}

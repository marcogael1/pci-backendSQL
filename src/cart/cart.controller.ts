import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  UnauthorizedException,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../jwtauthguard.guard';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  async getCart(@Req() req: Request) {
    const token = req.cookies['jwt'];
    const guestToken = req.cookies['guestId'];

    let userId: number | null = null;
    let guestId: string | null = null;

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno.',
      );
    }

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        throw new UnauthorizedException('Token inválido o expirado.');
      }
    } else if (guestToken) {
      try {
        const decoded: any = jwt.verify(guestToken, process.env.JWT_SECRET);
        guestId = decoded.guestId;
      } catch (err) {
        guestId = null;
      }
    }

    return this.cartService.getCart(userId, guestId);
  }
  @Post('add')
  async addToCart(
    @Req() req: Request,
    @Body() body: { productId: number; quantity: number },
  ) {
    const token = req.cookies['jwt'];
    let guestToken = req.cookies['guestId'];
    let userId: number | null = null;
    let guestId: string | null = null;

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno.',
      );
    }

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        throw new UnauthorizedException('Token inválido o expirado.');
      }
    }

    if (!userId && guestToken) {
      try {
        const decoded: any = jwt.verify(guestToken, process.env.JWT_SECRET);
        guestId = decoded.guestId;
      } catch (err) {
        guestId = null;
      }
    }

    if (!userId && !guestId) {
      guestId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      guestToken = jwt.sign({ guestId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      req.res?.cookie('guestId', guestToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return this.cartService.addToCart(
      userId,
      guestId,
      body.productId,
      body.quantity,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post('migrate')
  async migrateCart(@Req() req: Request & { user: { id: number } }) {
    const userId = req.user.id;
    const guestToken = req.cookies['guestId'];
    let guestId: string | null = null;

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno.',
      );
    }

    if (guestToken) {
      try {
        const decoded: any = jwt.verify(guestToken, process.env.JWT_SECRET);
        guestId = decoded.guestId;
      } catch (err) {
        guestId = null;
      }
    }

    return this.cartService.migrateGuestCart(userId, guestId);
  }

  // Verifica si el usuario tiene alguna dirección vinculada
  @Get('usuario/:id')
  async verificarDireccion(@Param('id') id: number) {
    const tieneDireccion = await this.cartService.verificarDireccionPorUsuario(id);
    return { tieneDireccion };
  }

  @Get('user/:id')
  async getFavorites(@Param('id') id: number) {
    return this.cartService.getFavoritesByUserId(id);
  }

  @Get('order/:id')
  async getOrdersByUser(@Param('id') userId: number) {
    return this.cartService.getOrdersByUserId(userId);
  }

  @Get('notification/:userId')
  async getNotificationsByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.cartService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createOrder(@Body() body: any, @Req() req: Request) {
    const user = req.user;
    const userId = Number(user.id); // Cast necesario
    const order = await this.cartService.createOrder(body, userId);

    return {
      message: 'Orden creada y correo enviado con éxito.',
      orderId: order.id,
    };
  }

  @Post('clear')
  async clearCart(@Req() req: Request) {
    const token = req.cookies['jwt'];
    const guestToken = req.cookies['guestId'];

    let userId: number | null = null;
    let guestId: string | null = null;

    const secret = process.env.JWT_SECRET!;
    if (token) {
      const decoded: any = jwt.verify(token, secret);
      userId = decoded.userId;
    } else if (guestToken) {
      const decoded: any = jwt.verify(guestToken, secret);
      guestId = decoded.guestId;
    }

    return this.cartService.clearCart(userId, guestId);
  }

  @Post('remove')
  async removeFromCart(@Req() req: Request, @Body() body: { productId: number }) {
    const token = req.cookies['jwt'];
    const guestToken = req.cookies['guestId'];

    let userId: number | null = null;
    let guestId: string | null = null;

    const secret = process.env.JWT_SECRET!;
    if (token) {
      const decoded: any = jwt.verify(token, secret);
      userId = decoded.userId;
    } else if (guestToken) {
      const decoded: any = jwt.verify(guestToken, secret);
      guestId = decoded.guestId;
    }

    return this.cartService.removeFromCart(userId, guestId, body.productId);
  }

  @Post('update')
  async updateQuantity(@Req() req: Request, @Body() body: { productId: number, quantity: number }) {
    const token = req.cookies['jwt'];
    const guestToken = req.cookies['guestId'];

    let userId: number | null = null;
    let guestId: string | null = null;

    const secret = process.env.JWT_SECRET!;
    if (token) {
      const decoded: any = jwt.verify(token, secret);
      userId = decoded.userId;
    } else if (guestToken) {
      const decoded: any = jwt.verify(guestToken, secret);
      guestId = decoded.guestId;
    }

    return this.cartService.updateQuantity(userId, guestId, body.productId, body.quantity);
  }

}

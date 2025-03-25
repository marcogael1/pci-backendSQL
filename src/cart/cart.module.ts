import { CartService } from './cart.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { User } from 'src/schemas/user.schema';
import { CartItem } from 'src/schemas/cart-item.schema';
import { ProductDetails } from 'src/schemas/productos.schema';
import { CartController } from './cart.controller';
import { JwtService } from '@nestjs/jwt';
@Module({
    imports: [
        TypeOrmModule.forFeature([User,CartItem,ProductDetails]),  
      ],
    controllers: [CartController],
    providers: [
        CartService,
        JwtService,  ],
})
export class CartModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { ProductSale } from '../schemas/productSale.schema';
import { ProductDetails } from 'src/schemas/productos.schema';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSale, ProductDetails])],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}

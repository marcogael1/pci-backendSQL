import { Controller, Get, Param, Post } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { get } from 'http';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get('prediccion/:productId')
  async predecir(@Param('productId') productId: string) {
    return this.ventasService.predecirVentas(Number(productId));
  }

  @Get('periodos/:productId')
  async consultarPeriodos(@Param('productId') id: string) {
    return this.ventasService.consultarVentasPorPeriodo(Number(id));
  }
}

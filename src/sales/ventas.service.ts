import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductSale } from '../schemas/productSale.schema';
import { ProductDetails } from '../schemas/productos.schema';
import { addMonths, parse, startOfWeek, format } from 'date-fns';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(ProductSale)
    private readonly salesRepo: Repository<ProductSale>,

    @InjectRepository(ProductDetails)
    private readonly productRepo: Repository<ProductDetails>,
  ) {}

  async predecirVentas(productId: number) {
    const producto = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['subcategory'],
    });

    if (!producto || !producto.subcategory) {
      return { mensaje: 'Producto o subcategoría no encontrada.' };
    }

    const subcategoryId = producto.subcategory.id;

    const productosSubcat = await this.productRepo.find({
      where: { subcategory: { id: subcategoryId } },
    });

    const productIds = productosSubcat.map((p) => p.id);

    const ventasSubcategoria = await this.salesRepo.find({
      where: { product_id: In(productIds) },
    });

    const ventasPorProducto: Record<number, Record<string, number>> = {};
    const totalesPorProducto: Record<number, number> = {};

    ventasSubcategoria.forEach(({ product_id, quantity_sold, sale_date }) => {
      const fecha = new Date(sale_date);
      const mes = fecha.toISOString().slice(0, 7);

      if (!ventasPorProducto[product_id]) {
        ventasPorProducto[product_id] = {};
        totalesPorProducto[product_id] = 0;
      }

      ventasPorProducto[product_id][mes] =
        (ventasPorProducto[product_id][mes] || 0) + quantity_sold;
      totalesPorProducto[product_id] += quantity_sold;
    });

    const productoMasVendido = Object.entries(totalesPorProducto).reduce(
      (acc, [pid, total]) =>
        total > acc.total ? { pid: Number(pid), total } : acc,
      { pid: 0, total: 0 },
    );

    const ventasPorMesSubcat: Record<string, number> = {};
    ventasSubcategoria.forEach(({ quantity_sold, sale_date }) => {
      const fecha = new Date(sale_date);
      const mes = fecha.toISOString().slice(0, 7);
      ventasPorMesSubcat[mes] = (ventasPorMesSubcat[mes] || 0) + quantity_sold;
    });

    const mesesSubcat = Object.keys(ventasPorMesSubcat).sort();
    const cantidadesSubcat = mesesSubcat.map((m) => ventasPorMesSubcat[m]);

    const prediccionesSubcategoria = this.calcularPredicciones(
      mesesSubcat,
      cantidadesSubcat,
    ).map((p) => ({ mes: p.mes, valor: redondearPersonalizado(p.valor) }));
    const ventasProducto = ventasPorProducto[productId] || {};
    const mesesProducto = Object.keys(ventasProducto).sort();
    const cantidadesProducto = mesesProducto.map((m) => ventasProducto[m]);
    const prediccionesProducto = this.calcularPredicciones(
      mesesProducto,
      cantidadesProducto,
    ).map((p) => ({ mes: p.mes, valor: redondearPersonalizado(p.valor) }));

    const proyeccion30Dias =
      prediccionesProducto.length > 0
        ? await redondearPersonalizado(prediccionesProducto[0].valor)
        : 0;

    // Punto de reorden simple: 25% de la proyección o mínimo 3 unidades
    const puntoReorden = Math.max(3, Math.round(proyeccion30Dias * 0.25));

    // Tendencia: comparación entre el último mes real y la predicción más próxima
    const ultimaReal = cantidadesProducto[cantidadesProducto.length - 1] || 0;
    const proximaPred = prediccionesProducto[0]?.valor || 0;
    const tendencia =
      ultimaReal > 0 ? ((proximaPred - ultimaReal) / ultimaReal) * 100 : 0;
    const productoMasVendidoData = productosSubcat.find(
      (p) => p.id === productoMasVendido.pid,
    );

    return {
      producto: {
        id: productId,
        nombre: producto.name,
        imagen: producto.image_url[0],
        precio: producto.price,
        stock: producto.stock,
      },
      subcategoria: subcategoryId,
      ventasMensualesProducto: {
        meses: mesesProducto,
        cantidades: cantidadesProducto,
      },
      prediccionesProducto,
      prediccionesSubcategoria,
      ventasMensualesSubcategoria: {
        meses: mesesSubcat,
        cantidades: cantidadesSubcat,
      },
      productosDeSubcategoria: productosSubcat.map((p) => ({
        id: p.id,
        nombre: p.name,
        ventasMensuales: ventasPorProducto[p.id] || {},
        total: totalesPorProducto[p.id] || 0,
      })),
      productoMasVendido: {
        id: productoMasVendido.pid,
        total: productoMasVendido.total,
        price: productoMasVendidoData?.price,
        stock: productoMasVendidoData?.stock,
        nombre: productoMasVendidoData?.name || 'Desconocido',
        imagen: productoMasVendidoData?.image_url[0] || '',
        ventasMensuales: ventasPorProducto[productoMasVendido.pid] || {},
      },
      recomendaciones: {
        puntoReorden,
        proyeccion30Dias,
        tendencia: parseFloat(tendencia.toFixed(1)), // Ej: +8.5%
      },
    };
  }

  async consultarVentasPorPeriodo(productId: number) {
    const ventas = await this.salesRepo.find({
      where: { product_id: productId },
    });

    const ventasPorDia: Record<string, number> = {};
    const ventasPorSemana: Record<string, number> = {};
    const ventasPorMes: Record<string, number> = {};

    ventas.forEach(({ quantity_sold, sale_date }) => {
      const fecha = new Date(sale_date);

      const dia = format(fecha, 'yyyy-MM-dd');
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + quantity_sold;

      const semana = format(
        startOfWeek(fecha, { weekStartsOn: 1 }),
        'yyyy-MM-dd',
      );
      ventasPorSemana[semana] = (ventasPorSemana[semana] || 0) + quantity_sold;

      const mes = format(fecha, 'yyyy-MM');
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + quantity_sold;
    });

    // ✅ Función para ordenar por clave de fecha
    const ordenarPorFecha = (obj: Record<string, number>) =>
      Object.keys(obj)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = obj[key];
            return acc;
          },
          {} as Record<string, number>,
        );

    return {
      producto: productId,
      ventasPorDia: ordenarPorFecha(ventasPorDia),
      ventasPorSemana: ordenarPorFecha(ventasPorSemana),
      ventasPorMes: ordenarPorFecha(ventasPorMes),
    };
  }

  // Función auxiliar reutilizable
  private calcularPredicciones(meses: string[], cantidades: number[]) {
    const t = meses.map((_, i) => i);
    const lnX = cantidades.map((x) => Math.log(x));

    const n = t.length;
    const sumT = t.reduce((a, b) => a + b, 0);
    const sumX = lnX.reduce((a, b) => a + b, 0);
    const sumTx = t.reduce((sum, val, i) => sum + val * lnX[i], 0);
    const sumTT = t.reduce((sum, val) => sum + val * val, 0);

    const k = (n * sumTx - sumT * sumX) / (n * sumTT - sumT * sumT);
    const lnA = (sumX - k * sumT) / n;

    const ultMes = meses[meses.length - 1];
    const ultFecha = parse(ultMes + '-01', 'yyyy-MM-dd', new Date());

    const predicciones = [];
    for (let i = 1; i <= 3; i++) {
      const fechaFutura = addMonths(ultFecha, i);
      const etiqueta = fechaFutura.toISOString().slice(0, 7);
      const tFut = t.length + (i - 1);
      const valor = Math.exp(lnA + k * tFut);
      predicciones.push({ mes: etiqueta, valor: parseFloat(valor.toFixed(2)) });
    }

    return predicciones;
  }
}

function redondearPersonalizado(valor: number): number {
  const decimal = valor - Math.floor(valor);
  return decimal >= 0.6 ? Math.ceil(valor) : Math.floor(valor);
}

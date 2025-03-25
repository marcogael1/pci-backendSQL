import { VentasModule } from './sales/ventas.module';
import { VentasService } from './sales/ventas.service';
import { TwilioModule } from './admin/twilio/twilio.module';
import { AdminProductModule } from './admin/products/admin-product.module';
import { CartModule } from './cart/cart.module';
import { ReviewModule } from './review/review.module';
import { CategoryModule } from './category/category.module';
import { ProductsModule } from './products/products.module';
import { AppConfigModule } from './services/appconfig.module';
import { LogsModule } from './services/logs.module';
import { EmailService } from './services/email.service';
import { IncidentMonitorService } from './incidentMonitor/incidentmonitor.service';
import { IncidentMonitorModule } from './incidentMonitor/incidentmonitor.module';
import { CompanyProfileModule } from './companyProfile/companyprofile.module';
import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RegisterModule } from './register/register.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CorsMiddleware } from './cors.middleware';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from './schemas/config.schema';
import { User } from './schemas/user.schema';
import { CompanyProfile } from './schemas/companyProfile.schema';
import { Information } from './schemas/information.schema';
import { Log } from './schemas/logs.schema';
import { ProductDetails } from './schemas/productos.schema';
import { Category } from './schemas/category.schema';
import { Brand } from './schemas/brand.schema';
import { Color } from './schemas/color.schema';
import { Subcategory } from './schemas/subcategory.schema';
import { Filter } from './schemas/filters.schema';
import { Review } from './schemas/review.schema';
import { CartItem } from './schemas/cart-item.schema';
import { ProductSpecification } from './schemas/product_specifications.schema';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { LogService } from './services/logs.service';
import { TwilioService } from './admin/twilio/twilio.service';
import { ProductSale } from './schemas/productSale.schema';


@Module({
  imports: [
        VentasModule, 
    TwilioModule, 
    AdminProductModule,
    CartModule,
    ReviewModule,
    CategoryModule,
    ProductsModule,
    AppConfigModule,
    ConfigModule,
    LogsModule,
    IncidentMonitorModule,
    CompanyProfileModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB || 'pciTecno',
      entities: [AppConfig, User, CompanyProfile, Information, Log, ProductDetails, Category, Brand, Color, Subcategory, Filter, Review, CartItem, ProductSpecification, ProductSale],
      synchronize: false,
    }),
    ThrottlerModule.forRoot([{
      ttl: 1000,
      limit: 10,
    }]),
    RegisterModule,
    AdminModule,
    AuthModule,
  ],
  providers: [
    EmailService,
    IncidentMonitorService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

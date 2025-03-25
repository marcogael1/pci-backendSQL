import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDetails } from 'src/schemas/productos.schema';
import { Review } from 'src/schemas/review.schema';
import { User } from 'src/schemas/user.schema';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProductDetails,Review, User]),
    ],
    controllers: [
        ReviewController,],
    providers: [
        ReviewService,],
})
export class ReviewModule { }

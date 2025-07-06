import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../schemas/review.schema';
import { ProductDetails } from '../schemas/productos.schema';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(ProductDetails)
    private readonly productRepository: Repository<ProductDetails>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProductReviews(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.product = :productId', { productId })
      .getRawOne();

    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId } },
      relations: ['user'],
      select: {
        id: true,
        rating: true,
        comment: true,
        user: {
          username: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return {
      productId,
      averageRating: Number(stats.averageRating || 0).toFixed(1),
      totalReviews: Number(stats.totalReviews || 0),
      reviews,
    };
  }

  // 📌 Nueva función para agregar una reseña
  async addReview(
    productId: number,
    rating: number,
    comment: string,
    userId: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId, 10) },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('La calificación debe estar entre 1 y 5.');
    }

    const newReview = this.reviewRepository.create({
      rating,
      comment,
      user,
      product,
    });

    await this.reviewRepository.save(newReview);

    return { message: 'Reseña agregada exitosamente.' };
  }
}

import { Controller, Get, Post, Body, Param, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/jwtauthguard.guard';
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get(':productId')
  async getProductReviews(@Param('productId') productId: number) {
    return await this.reviewService.getProductReviews(productId);
  }


  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addReview(
    @Body() reviewDto: { productId: number; rating: number; comment: string },
    @Req() req: Request
  ) {
    const user = req.user; 

    if (!user) {
      throw new BadRequestException('No se pudo autenticar al usuario.');
    }

    return await this.reviewService.addReview(reviewDto.productId, reviewDto.rating, reviewDto.comment, user.id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../schemas/cart-item.schema';
import { User } from '../schemas/user.schema';
import { ProductDetails } from '../schemas/productos.schema';
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private cartRepository: Repository<CartItem>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(ProductDetails) private productRepository: Repository<ProductDetails>,
  ) {}

  async getCart(userId: number | null, guestId: string | null) {
    const cartItems = await this.cartRepository.find({
      where: userId ? { user: { id: userId } } : { guestId },
      relations: ['product'],
    });

    return cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      stock: item.product.stock,
      price: item.product.price,
      quantity: item.quantity,
      imageUrl: item.product.image_url,
    }));
  }

  async addToCart(userId: number | null, guestId: string | null, productId: number, quantity: number) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
  
    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }
  
    const existingItem = await this.cartRepository.findOne({
      where: userId
        ? { user: { id: userId }, product: { id: productId } }
        : { guestId, product: { id: productId } },
    });
  
    if (existingItem) {
      existingItem.quantity += quantity;
      return this.cartRepository.save(existingItem);
    } else {
      const newItem = this.cartRepository.create({
        user: userId ? { id: userId } : null,
        guestId: userId ? null : guestId,
        product,
        quantity,
      });
  
      return this.cartRepository.save(newItem);
    }
  }
  
  async migrateGuestCart(userId: number, guestId: string | null) {
    if (!guestId) return;
  
    const user = await this.userRepository.findOne({ where: { id: userId } });
  
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
  
    const guestCartItems = await this.cartRepository.find({ where: { guestId }, relations: ['product'] });
  
    for (const item of guestCartItems) {
      const existingItem = await this.cartRepository.findOne({
        where: { user: { id: userId }, product: { id: item.product.id } },
      });
  
      if (existingItem) {
        existingItem.quantity += item.quantity;
        await this.cartRepository.save(existingItem);
      } else {
        item.user = user; 
        item.guestId = null;
        await this.cartRepository.save(item);
      }
    }
  }
  
  
}

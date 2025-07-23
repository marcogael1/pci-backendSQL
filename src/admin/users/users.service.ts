import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/schemas/user.schema';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async updateUserStatus(id: number, status: 'active' | 'blocked'): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    if (status === 'blocked') {
      user.lockUntil = new Date('2100-01-01T00:00:00Z'); // fecha lejana para impedir acceso
      user.blockedHistory = [...(user.blockedHistory || []), { date: new Date() }];
    } else {
      user.lockUntil = null;
      user.blockedHistory = [];
    }

    return this.userRepository.save(user);
  }

  async updateUserRole(id: number, role: 'admin' | 'empleado'): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    if (!['admin', 'empleado'].includes(role)) {
      throw new Error('Rol no válido. Solo se permite admin o empleado.');
    }

    user.type = role;

    return this.userRepository.save(user);
  }

  async changeUserRole(id: number, newRole: 'empleado' | 'cliente'): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    const currentRole = user.type;

    const validTransitions: Record<string, string[]> = {
      'admin': ['empleado'],
      'empleado': ['cliente'],
    };

    if (!(currentRole in validTransitions) || !validTransitions[currentRole].includes(newRole)) {
      throw new ForbiddenException(`No se puede cambiar de ${currentRole} a ${newRole}.`);
    }

    user.type = newRole;
    return this.userRepository.save(user);
  }



}

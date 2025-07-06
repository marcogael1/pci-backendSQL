import { Controller, Get, UseGuards, Req, ForbiddenException, Put, Body, Param } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { User } from 'src/schemas/user.schema';
import { JwtAuthGuard } from 'src/jwtauthguard.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @Get()
    async findAll(@Req() req: Request): Promise<User[]> {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Acceso denegado: solo administradores.');
        }
        return await this.userService.findAll();
    }

    @Put(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'active' | 'blocked' },
        @Req() req: Request,
    ) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Solo los administradores pueden cambiar el estado de usuarios.');
        }

        const updatedUser = await this.userService.updateUserStatus(+id, body.status);
        return {
            message: `Usuario ${body.status === 'blocked' ? 'bloqueado' : 'desbloqueado'} correctamente.`,
            userId: updatedUser.id,
        };
    }

}

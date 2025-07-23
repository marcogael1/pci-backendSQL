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
        if (req.user?.role !== 'admin' && req.user?.role !== 'empleado') {
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

    @Put(':id/role')
    async updateUserRole(
        @Param('id') id: string,
        @Body() body: { role: 'admin' | 'empleado' },
        @Req() req: Request
    ) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Solo los administradores pueden cambiar roles.');
        }

        if (req.user?.id === id) {
            throw new ForbiddenException('No puedes cambiar tu propio rol.');
        }

        const updatedUser = await this.userService.updateUserRole(+id, body.role);

        return {
            message: `Rol actualizado correctamente a ${body.role}.`,
            userId: updatedUser.id,
            newRole: updatedUser.type,
        };
    }

    @Put(':id/change-role')
    async changeUserRole(
        @Param('id') id: string,
        @Body() body: { role: 'empleado' | 'cliente' },
        @Req() req: Request
    ) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Solo los administradores pueden modificar roles.');
        }

        if (req.user?.id === id) {
            throw new ForbiddenException('No puedes cambiar tu propio rol.');
        }

        const newRole = body.role;
        if (!['empleado', 'cliente'].includes(newRole)) {
            throw new ForbiddenException('Rol destino inválido.');
        }

        const updatedUser = await this.userService.changeUserRole(+id, newRole);

        return {
            message: `Rol cambiado correctamente a ${newRole}.`,
            userId: updatedUser.id,
            newRole: updatedUser.type,
        };
    }

}

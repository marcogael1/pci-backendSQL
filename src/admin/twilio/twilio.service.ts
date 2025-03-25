import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { VerificationInstance } from 'twilio/lib/rest/verify/v2/service/verification';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck';
import { User } from '../../schemas/user.schema';

@Injectable()
export class TwilioService {
    #client: Twilio;

    private readonly AUTH_TOKEN: string =
        this.configService.get<string>('TWILIO_AUTH_TOKEN');
    private readonly ACCOUNT_SID: string =
        this.configService.get<string>('TWILIO_ACCOUNT_SID');
    private readonly VERIFY_SERVICE_SID: string = this.configService.get<string>(
        'TWILIO_SERVICE_SID',
    );

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,  // Inyectamos el repositorio de User
    ) {
        this.#client = new Twilio(this.ACCOUNT_SID, this.AUTH_TOKEN);
    }

    async sendVerification(to: string): Promise<VerificationInstance> {
        try {
            const verification = await this.#client.verify.v2
                .services(this.VERIFY_SERVICE_SID)
                .verifications.create({ to, channel: 'sms' });
            await this.userRepository.update(
                { cellPhone: to },
                {
                    resetToken: verification.sid,
                    resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
                }
            );


            return verification;
        } catch (error) {
            console.log(error)
            throw new Error('Error al enviar el código de verificación');
        }
    }

    async checkVerification(
        to: string,
        code: string,
    ): Promise<{ message: string; resetToken: string }> {
        try {
            const verificationCheck = await this.#client.verify.v2
                .services(this.VERIFY_SERVICE_SID)
                .verificationChecks.create({ to, code });
            const user = await this.userRepository.findOne({ where: { cellPhone: to } });

            const now = new Date();
            if (user.resetTokenExpires < now) {
                throw new Error('El código OTP ha expirado');
            }
            return {
                message: 'OTP verificado correctamente',
                resetToken: user.resetToken,  // Devuelve el SID almacenado como resetToken
            };
        } catch (error) {
            throw new Error('Error al verificar el código de verificación');
        }
    }
}

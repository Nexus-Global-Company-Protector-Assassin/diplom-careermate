import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RtStrategy } from './rt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        MailModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, JwtStrategy, RtStrategy, GoogleStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }

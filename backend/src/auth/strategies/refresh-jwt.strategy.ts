import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken') || 
                      ExtractJwt.fromHeader('refresh-token') ||
                      ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('REFRESH_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // In a real implementation, you might want to check if the refresh token is blacklisted
    // and verify that it's still valid in your database
    
    return { userId: payload.sub, email: payload.email };
  }
}
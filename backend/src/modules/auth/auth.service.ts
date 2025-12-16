import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, hashedRefreshToken, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    async register(email: string, pass: string) {
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(pass, 10);
        const user = await this.usersService.create({
            email,
            passwordHash: hashedPassword,
        });

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    async logout(userId: string) {
        await this.usersService.update(userId, { hashedRefreshToken: null });
    }

    async refreshTokens(userId: string, rt: string) {
        const user = await this.usersService.findOne(userId);
        if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

        const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
        if (!rtMatches) throw new ForbiddenException('Access Denied');

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    async updateRefreshToken(userId: string, rt: string) {
        const hash = await bcrypt.hash(rt, 10);
        await this.usersService.update(userId, { hashedRefreshToken: hash });
    }

    async getTokens(userId: string, email: string) {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, email },
                {
                    secret: this.configService.get<string>('JWT_SECRET') || 'secretKey',
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, email },
                {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecretKey',
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            access_token: at,
            refresh_token: rt,
        };
    }
}

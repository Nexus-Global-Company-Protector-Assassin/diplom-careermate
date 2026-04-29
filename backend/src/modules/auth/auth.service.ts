import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { GoogleUserPayload } from './strategies/google.strategy';

const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFICATION_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email.toLowerCase());
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

    /**
     * Legacy single-step register (kept for backward compatibility, no email verification)
     */
    async register(email: string, pass: string) {
        const normalizedEmail = email.toLowerCase();
        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(pass, 10);
        const user = await this.usersService.create({
            email: normalizedEmail,
            passwordHash: hashedPassword,
            emailVerified: true,
        });

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    /**
     * Step 1 of email-verified registration: hash password, store with code, send email.
     * Does NOT create User yet — that happens after verification.
     */
    async requestRegistrationCode(email: string, password: string): Promise<{ message: string; expiresInSeconds: number }> {
        const normalizedEmail = email.toLowerCase();

        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        // Rate limit: refuse if a non-expired non-used code was issued within RESEND_COOLDOWN_MS
        const recent = await this.prisma.emailVerificationCode.findFirst({
            where: { email: normalizedEmail, used: false },
            orderBy: { createdAt: 'desc' },
        });
        if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
            const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
            throw new BadRequestException(`Подождите ${waitSec} сек. перед запросом нового кода`);
        }

        // Invalidate any previous codes for this email
        await this.prisma.emailVerificationCode.updateMany({
            where: { email: normalizedEmail, used: false },
            data: { used: true },
        });

        const code = this.generateCode();
        const codeHash = await bcrypt.hash(code, 10);
        const passwordHash = await bcrypt.hash(password, 10);
        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

        await this.prisma.emailVerificationCode.create({
            data: {
                email: normalizedEmail,
                codeHash,
                passwordHash,
                expiresAt,
            },
        });

        try {
            await this.mailService.sendVerificationCode(normalizedEmail, code);
        } catch (err) {
            this.logger.error(`[requestRegistrationCode] Mail send failed for ${normalizedEmail}`, err instanceof Error ? err.message : err);
            throw new BadRequestException('Не удалось отправить email. Попробуйте позже.');
        }

        return {
            message: 'Код отправлен на ваш email',
            expiresInSeconds: Math.floor(VERIFICATION_CODE_TTL_MS / 1000),
        };
    }

    /**
     * Step 2: verify code, create User, return tokens.
     */
    async verifyRegistrationCode(email: string, code: string) {
        const normalizedEmail = email.toLowerCase();

        const record = await this.prisma.emailVerificationCode.findFirst({
            where: { email: normalizedEmail, used: false },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            throw new BadRequestException('Код не найден. Запросите новый код.');
        }

        if (record.expiresAt < new Date()) {
            await this.prisma.emailVerificationCode.update({
                where: { id: record.id },
                data: { used: true },
            });
            throw new BadRequestException('Код истёк. Запросите новый код.');
        }

        if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
            await this.prisma.emailVerificationCode.update({
                where: { id: record.id },
                data: { used: true },
            });
            throw new BadRequestException('Превышено количество попыток. Запросите новый код.');
        }

        const matches = await bcrypt.compare(code, record.codeHash);
        if (!matches) {
            await this.prisma.emailVerificationCode.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            const remaining = MAX_VERIFICATION_ATTEMPTS - (record.attempts + 1);
            throw new BadRequestException(
                remaining > 0
                    ? `Неверный код. Осталось попыток: ${remaining}`
                    : 'Неверный код. Запросите новый код.',
            );
        }

        // Race-condition guard: someone might have registered with this email between request & verify
        const existing = await this.usersService.findByEmail(normalizedEmail);
        if (existing) {
            await this.prisma.emailVerificationCode.update({
                where: { id: record.id },
                data: { used: true },
            });
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        const user = await this.usersService.create({
            email: normalizedEmail,
            passwordHash: record.passwordHash,
            emailVerified: true,
        });

        await this.prisma.emailVerificationCode.update({
            where: { id: record.id },
            data: { used: true },
        });

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    /**
     * Resend verification code if cooldown has passed. Requires an active (unverified) code record.
     */
    async resendRegistrationCode(email: string): Promise<{ message: string; expiresInSeconds: number }> {
        const normalizedEmail = email.toLowerCase();

        const recent = await this.prisma.emailVerificationCode.findFirst({
            where: { email: normalizedEmail, used: false },
            orderBy: { createdAt: 'desc' },
        });

        if (!recent) {
            throw new BadRequestException('Сначала запросите регистрацию через /auth/register/request-code');
        }

        if (Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
            const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
            throw new BadRequestException(`Подождите ${waitSec} сек. перед запросом нового кода`);
        }

        // Invalidate previous, create new with same passwordHash
        await this.prisma.emailVerificationCode.update({
            where: { id: recent.id },
            data: { used: true },
        });

        const code = this.generateCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

        await this.prisma.emailVerificationCode.create({
            data: {
                email: normalizedEmail,
                codeHash,
                passwordHash: recent.passwordHash,
                expiresAt,
            },
        });

        try {
            await this.mailService.sendVerificationCode(normalizedEmail, code);
        } catch (err) {
            this.logger.error(`[resendRegistrationCode] Mail send failed for ${normalizedEmail}`, err instanceof Error ? err.message : err);
            throw new BadRequestException('Не удалось отправить email. Попробуйте позже.');
        }

        return {
            message: 'Новый код отправлен на ваш email',
            expiresInSeconds: Math.floor(VERIFICATION_CODE_TTL_MS / 1000),
        };
    }

    /**
     * Google OAuth callback handler — find/link/create user, return tokens.
     */
    async handleGoogleAuth(payload: GoogleUserPayload) {
        const email = payload.email.toLowerCase();

        // 1. Find by oauthId — direct match for returning Google user
        let user = await this.prisma.user.findFirst({
            where: { oauthProvider: 'google', oauthId: payload.googleId },
        });

        if (!user) {
            // 2. Find by email — link Google to existing account
            const byEmail = await this.usersService.findByEmail(email);
            if (byEmail) {
                user = await this.prisma.user.update({
                    where: { id: byEmail.id },
                    data: {
                        oauthProvider: 'google',
                        oauthId: payload.googleId,
                        emailVerified: true,
                    },
                });
            }
        }

        if (!user) {
            // 3. Create new user — Google email is auto-verified
            user = await this.usersService.create({
                email,
                emailVerified: true,
                oauthProvider: 'google',
                oauthId: payload.googleId,
            });
        }

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
                    secret: this.configService.getOrThrow<string>('JWT_SECRET'),
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, email },
                {
                    secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            access_token: at,
            refresh_token: rt,
        };
    }

    /**
     * Generate cryptographically random 6-digit numeric code.
     * Uses rejection sampling on crypto.randomInt to avoid modulo bias.
     */
    private generateCode(): string {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { randomInt } = require('crypto') as typeof import('crypto');
        const num = randomInt(0, 1_000_000);
        return num.toString().padStart(6, '0');
    }
}

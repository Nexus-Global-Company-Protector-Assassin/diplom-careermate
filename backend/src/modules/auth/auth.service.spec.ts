import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuthService — registration with email code', () => {
    let service: AuthService;
    let usersService: jest.Mocked<Partial<UsersService>>;
    let mailService: jest.Mocked<Partial<MailService>>;
    let prisma: any;
    let jwtService: jest.Mocked<Partial<JwtService>>;
    let config: jest.Mocked<Partial<ConfigService>>;

    // In-memory store for EmailVerificationCode rows
    let codes: any[];

    beforeEach(() => {
        codes = [];

        usersService = {
            findByEmail: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation(async (data: any) => ({ id: 'user-1', ...data })),
            update: jest.fn().mockResolvedValue({}),
        };

        mailService = {
            sendVerificationCode: jest.fn().mockResolvedValue(undefined),
        };

        prisma = {
            emailVerificationCode: {
                findFirst: jest.fn().mockImplementation(async ({ where, orderBy: _orderBy }: any) => {
                    const filtered = codes
                        .filter((c) => c.email === where.email && c.used === where.used)
                        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                    return filtered[0] || null;
                }),
                create: jest.fn().mockImplementation(async ({ data }: any) => {
                    const row = { id: `code-${codes.length + 1}`, createdAt: new Date(), attempts: 0, used: false, ...data };
                    codes.push(row);
                    return row;
                }),
                update: jest.fn().mockImplementation(async ({ where, data }: any) => {
                    const row = codes.find((c) => c.id === where.id);
                    if (!row) throw new Error('not found');
                    const prevAttempts = row.attempts || 0;
                    Object.assign(row, data);
                    if (data.attempts && typeof data.attempts === 'object' && data.attempts.increment) {
                        row.attempts = prevAttempts + data.attempts.increment;
                    }
                    return row;
                }),
                updateMany: jest.fn().mockImplementation(async ({ where, data }: any) => {
                    let count = 0;
                    for (const row of codes) {
                        if (row.email === where.email && row.used === where.used) {
                            Object.assign(row, data);
                            count++;
                        }
                    }
                    return { count };
                }),
            },
            user: { findFirst: jest.fn(), update: jest.fn() },
        };

        jwtService = {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
        };

        config = {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
        };

        service = new AuthService(
            usersService as UsersService,
            jwtService as JwtService,
            config as ConfigService,
            prisma as PrismaService,
            mailService as MailService,
        );
    });

    describe('requestRegistrationCode', () => {
        it('rejects when user already exists', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValueOnce({ id: 'existing' });
            await expect(service.requestRegistrationCode('a@b.com', 'pass1234')).rejects.toThrow(ConflictException);
            expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
        });

        it('creates a verification record and sends email', async () => {
            await service.requestRegistrationCode('Test@Example.com', 'mypassword');

            expect(codes).toHaveLength(1);
            expect(codes[0].email).toBe('test@example.com'); // normalized
            expect(codes[0].used).toBe(false);
            expect(codes[0].codeHash).toBeTruthy();
            expect(codes[0].passwordHash).toBeTruthy();
            expect(mailService.sendVerificationCode).toHaveBeenCalledWith('test@example.com', expect.stringMatching(/^\d{6}$/));
        });

        it('hashes the password (not stored in plaintext)', async () => {
            await service.requestRegistrationCode('a@b.com', 'plaintext-pass');
            const ph = codes[0].passwordHash;
            expect(ph).not.toBe('plaintext-pass');
            expect(await bcrypt.compare('plaintext-pass', ph)).toBe(true);
        });

        it('rejects rapid resends within 60s cooldown', async () => {
            await service.requestRegistrationCode('a@b.com', 'pass1234');
            await expect(service.requestRegistrationCode('a@b.com', 'pass1234')).rejects.toThrow(BadRequestException);
        });

        it('invalidates older codes when issuing a new one (after cooldown)', async () => {
            await service.requestRegistrationCode('a@b.com', 'pass1234');
            // Simulate older code
            codes[0].createdAt = new Date(Date.now() - 120_000);

            await service.requestRegistrationCode('a@b.com', 'pass1234');
            expect(codes[0].used).toBe(true);
            expect(codes).toHaveLength(2);
            expect(codes[1].used).toBe(false);
        });
    });

    describe('verifyRegistrationCode', () => {
        it('rejects when no active code exists', async () => {
            await expect(service.verifyRegistrationCode('a@b.com', '123456')).rejects.toThrow(BadRequestException);
        });

        it('rejects expired code and marks it used', async () => {
            const codeHash = await bcrypt.hash('123456', 10);
            const passwordHash = await bcrypt.hash('pass', 10);
            codes.push({
                id: 'c1',
                email: 'a@b.com',
                codeHash,
                passwordHash,
                expiresAt: new Date(Date.now() - 1000),
                attempts: 0,
                used: false,
                createdAt: new Date(),
            });

            await expect(service.verifyRegistrationCode('a@b.com', '123456')).rejects.toThrow(/истёк/);
            expect(codes[0].used).toBe(true);
        });

        it('rejects wrong code and increments attempts', async () => {
            const codeHash = await bcrypt.hash('123456', 10);
            const passwordHash = await bcrypt.hash('pass', 10);
            codes.push({
                id: 'c1',
                email: 'a@b.com',
                codeHash,
                passwordHash,
                expiresAt: new Date(Date.now() + 60_000),
                attempts: 0,
                used: false,
                createdAt: new Date(),
            });

            await expect(service.verifyRegistrationCode('a@b.com', '999999')).rejects.toThrow(/Неверный код/);
            expect(codes[0].attempts).toBe(1);
            expect(codes[0].used).toBe(false);
        });

        it('locks code after 5 failed attempts', async () => {
            const codeHash = await bcrypt.hash('123456', 10);
            const passwordHash = await bcrypt.hash('pass', 10);
            codes.push({
                id: 'c1',
                email: 'a@b.com',
                codeHash,
                passwordHash,
                expiresAt: new Date(Date.now() + 60_000),
                attempts: 5,
                used: false,
                createdAt: new Date(),
            });

            await expect(service.verifyRegistrationCode('a@b.com', '123456')).rejects.toThrow(/Превышено количество попыток/);
            expect(codes[0].used).toBe(true);
        });

        it('creates user and returns tokens on correct code', async () => {
            const codeHash = await bcrypt.hash('123456', 10);
            const passwordHash = await bcrypt.hash('mypass', 10);
            codes.push({
                id: 'c1',
                email: 'a@b.com',
                codeHash,
                passwordHash,
                expiresAt: new Date(Date.now() + 60_000),
                attempts: 0,
                used: false,
                createdAt: new Date(),
            });

            const result = await service.verifyRegistrationCode('A@B.com', '123456');

            expect(usersService.create).toHaveBeenCalledWith({
                email: 'a@b.com',
                passwordHash,
                emailVerified: true,
            });
            expect(codes[0].used).toBe(true);
            expect(result.access_token).toBe('mock-jwt-token');
            expect(result.refresh_token).toBe('mock-jwt-token');
        });

        it('rejects if user was created concurrently between request & verify', async () => {
            const codeHash = await bcrypt.hash('123456', 10);
            const passwordHash = await bcrypt.hash('pass', 10);
            codes.push({
                id: 'c1',
                email: 'a@b.com',
                codeHash,
                passwordHash,
                expiresAt: new Date(Date.now() + 60_000),
                attempts: 0,
                used: false,
                createdAt: new Date(),
            });
            (usersService.findByEmail as jest.Mock).mockResolvedValueOnce({ id: 'race' });

            await expect(service.verifyRegistrationCode('a@b.com', '123456')).rejects.toThrow(ConflictException);
            expect(codes[0].used).toBe(true);
            expect(usersService.create).not.toHaveBeenCalled();
        });
    });

    describe('handleGoogleAuth', () => {
        it('creates a new user when no existing match', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

            const tokens = await service.handleGoogleAuth({
                googleId: 'g-123',
                email: 'NewUser@Gmail.com',
                fullName: 'New User',
            });

            expect(usersService.create).toHaveBeenCalledWith({
                email: 'newuser@gmail.com',
                emailVerified: true,
                oauthProvider: 'google',
                oauthId: 'g-123',
            });
            expect(tokens.access_token).toBeTruthy();
        });

        it('reuses existing Google user (matched by oauthId)', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'u-1', email: 'a@b.com' });

            await service.handleGoogleAuth({ googleId: 'g-1', email: 'a@b.com' });
            expect(usersService.create).not.toHaveBeenCalled();
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('links Google to existing email-password account', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (usersService.findByEmail as jest.Mock).mockResolvedValueOnce({ id: 'u-2', email: 'linked@b.com' });
            (prisma.user.update as jest.Mock).mockResolvedValueOnce({ id: 'u-2', email: 'linked@b.com' });

            await service.handleGoogleAuth({ googleId: 'g-2', email: 'Linked@B.com' });

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'u-2' },
                data: { oauthProvider: 'google', oauthId: 'g-2', emailVerified: true },
            });
            expect(usersService.create).not.toHaveBeenCalled();
        });
    });
});

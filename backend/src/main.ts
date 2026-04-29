// Force Node DNS to prefer IPv4. Some networks (Windows + ISP without IPv6 transit)
// route IPv6 to dead ends, which makes outbound HTTPS to Google OAuth / Adzuna /
// Polza fail at the TLS socket layer with "socket hang up". Setting this BEFORE
// any module loads (so it takes effect for `https.request`, axios, passport-oauth2,
// etc.) avoids `InternalOAuthError: Failed to obtain access token` on Google sign-in.
import { setDefaultResultOrder } from 'dns';
try { setDefaultResultOrder('ipv4first'); } catch { /* Node < 18 */ }

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
    const winstonLogger = WinstonModule.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                ),
            }),
        ],
    });

    const app = await NestFactory.create(AppModule, {
        logger: winstonLogger,
    });
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Security headers
    app.use((helmet as any).default ? (helmet as any).default() : (helmet as any)());

    // Gzip compression
    app.use((compression as any).default ? (compression as any).default() : (compression as any)());

    // Enable CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN') || configService.get('FRONTEND_URL') || 'http://localhost:3000',
        credentials: true,
    });

    // Global Prefix
    const globalPrefix = configService.get('API_PREFIX') || 'api/v1';
    app.setGlobalPrefix(globalPrefix, {
        exclude: ['/', 'auth/google', 'auth/google/callback'],
    });

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Global Exception Filters (order matters: last registered = first executed)
    app.useGlobalFilters(
        new PrismaExceptionFilter(),
        new HttpExceptionFilter(),
    );

    // Swagger Setup
    const config = new DocumentBuilder()
        .setTitle('CareerMate API')
        .setDescription('CareerMate REST API — Authentication, Profiles, Career Paths')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get('PORT') || 3001;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`);
    logger.log(`Swagger UI is available at: http://localhost:${port}/api/docs`);
}
bootstrap();


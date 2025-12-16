import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Enable CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN') || '*',
        credentials: true,
    });

    // Global Prefix
    const globalPrefix = configService.get('API_PREFIX') || 'api/v1';
    app.setGlobalPrefix(globalPrefix, {
        exclude: ['/'],
    });

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Swagger Setup
    const config = new DocumentBuilder()
        .setTitle('CareerMate API')
        .setDescription('The CareerMate API description')
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

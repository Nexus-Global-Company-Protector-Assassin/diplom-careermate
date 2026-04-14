import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PocModule } from './modules/poc/poc.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
        }),
        // Rate limiting: 100 req/min globally
        ThrottlerModule.forRoot([
            {
                ttl: 60000, // 1 minute in ms
                limit: 100,
            },
        ]),
        DatabaseModule,
        AuthModule,
        UsersModule,
        RedisModule,
        ProfilesModule,
        PocModule,
        VacanciesModule,
    ],
    controllers: [HealthController, AppController],
    providers: [],
})
export class AppModule { }


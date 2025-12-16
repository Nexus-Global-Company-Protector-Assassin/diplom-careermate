import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PocModule } from './modules/poc/poc.module';
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
        DatabaseModule,
        AuthModule,
        UsersModule,
        RedisModule,
        ProfilesModule,
        PocModule,
    ],
    controllers: [HealthController, AppController],
    providers: [],
})
export class AppModule { }

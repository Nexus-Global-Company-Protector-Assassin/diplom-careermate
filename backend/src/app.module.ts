import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PocModule } from './modules/poc/poc.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { SkillsModule } from './modules/skills/skills.module';
import { Neo4jModule } from './modules/neo4j/neo4j.module';
import { CareerAssessmentModule } from './modules/career-assessment/career-assessment.module';
import { QuotaModule } from './modules/quota/quota.module';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { StorageModule } from './modules/storage/storage.module';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        ScheduleModule.forRoot(),
        DatabaseModule,
        Neo4jModule,
        AuthModule,
        UsersModule,
        RedisModule,
        StorageModule,
        MetricsModule,
        ProfilesModule,
        PocModule,
        VacanciesModule,
        ResumesModule,
        InterviewsModule,
        AnalyticsModule,
        AiModule,
        SkillsModule,
        CareerAssessmentModule,
        QuotaModule,
    ],
    controllers: [HealthController, AppController],
    providers: [],
})
export class AppModule {}


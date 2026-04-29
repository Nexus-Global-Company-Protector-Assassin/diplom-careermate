import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisModule } from './analysis/analysis.module';
import { AgentModule } from './agent/agent.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AnalysisModule,
        AgentModule,
    ],
    controllers: [HealthController],
    providers: [],
})
export class AppModule { }

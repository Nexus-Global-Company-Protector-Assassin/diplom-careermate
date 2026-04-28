import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisModule } from './analysis/analysis.module';
import { AgentModule } from './agent/agent.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AnalysisModule,
        AgentModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

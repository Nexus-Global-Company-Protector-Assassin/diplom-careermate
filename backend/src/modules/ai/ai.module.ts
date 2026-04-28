import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../../database/database.module';
import { LlmProviderService } from './providers/llm-provider.service';
import { QuotaModule } from '../quota/quota.module';

@Module({
    imports: [DatabaseModule, QuotaModule],
    controllers: [AiController],
    providers: [AiService, LlmProviderService],
    exports: [AiService],
})
export class AiModule {}

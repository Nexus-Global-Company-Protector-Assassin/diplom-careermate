import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MlRankingService } from './ml-ranking.service';

@Module({
    imports: [HttpModule, ConfigModule],
    providers: [MlRankingService],
    exports: [MlRankingService],
})
export class MlRankingModule {}

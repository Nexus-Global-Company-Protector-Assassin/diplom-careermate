import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [
        HttpModule,
        DatabaseModule,
    ],
    controllers: [SkillsController],
    providers: [SkillsService],
    exports: [SkillsService],
})
export class SkillsModule {}

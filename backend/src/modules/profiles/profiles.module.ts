import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { DatabaseModule } from '../../database/database.module';
import { SkillsModule } from '../skills/skills.module';

@Module({
    imports: [DatabaseModule, SkillsModule],
    controllers: [ProfilesController],
    providers: [ProfilesService],
    exports: [ProfilesService],
})
export class ProfilesModule { }

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PocService } from './poc.service';
import { PocController } from './poc.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [PocController],
    providers: [PocService],
})
export class PocModule { }

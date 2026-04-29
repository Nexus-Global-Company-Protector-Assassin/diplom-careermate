import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClassifiedSkill {
    canonicalName: string;
    category: string;
    aliases: string[];
}

@Injectable()
export class SkillClassifierService {
    constructor(private readonly configService: ConfigService) {}

    async classifySkill(rawName: string): Promise<ClassifiedSkill> {
        const canonicalName = rawName.charAt(0).toUpperCase() + rawName.slice(1).trim();
        return { canonicalName, category: 'Other', aliases: [] };
    }
}

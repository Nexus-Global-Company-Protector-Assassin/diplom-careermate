import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { CacheService } from '../cache/cache.service';
import { ProfileDataSchema, ParsedProfileData } from '../schemas/profile-data.schema';

@Injectable()
export class ParseResumeTool {
    private readonly logger = new Logger(ParseResumeTool.name);

    constructor(
        private readonly llmGateway: LlmGatewayService,
        private readonly cacheService: CacheService,
    ) {}

    async run(rawText: string): Promise<ParsedProfileData> {
        this.logger.log(`Starting to parse raw resume text (length: ${rawText.length})`);

        const hash = this.cacheService.generateHash(rawText);
        const cacheKey = `ai:parse-resume:${hash}`;

        return this.cacheService.getOrSet(cacheKey, async () => {
            const result = await this.llmGateway.generateJson<ParsedProfileData>(
                [
                    {
                        role: 'system',
                        content: `Ты эксперт по извлечению данных из резюме. Твоя задача — извлечь ВСЕ структурированные данные из текста резюме.

Правила:
- phone: извлеки номер телефона в оригинальном формате, если он есть
- location: извлеки город/регион проживания (например "Владивосток", "Москва")
- skills: извлеки АБСОЛЮТНО ВСЕ навыки — технологии, языки программирования, фреймворки, инструменты, базы данных, методологии, библиотеки, мягкие навыки
- education: извлеки ВСЕ записи об образовании. Для каждой записи: institution (вуз/курс), field (специальность/программа), degree (уровень: бакалавр/магистр/неоконченное высшее/и т.д.), endYear (ОБЯЗАТЕЛЬНО извлеки как число если год упоминается рядом, например "2026" → endYear: 2026)
- aboutMe: извлеки блок с личным описанием кандидата. Ищи разделы: "О себе", "Обо мне", "Дополнительная информация", "О кандидате", "Summary", "Profile", "About me" — весь текст из этого раздела помести в aboutMe целиком
- workExperience: для каждого места работы обязательно заполни description — перепиши все обязанности, проекты и достижения с этого места работы из текста резюме дословно
- Если желаемая должность не указана явно — выведи её из последней должности или навыков
- При нечётком тексте восстанавливай логику (например, вычисляй стаж)`,
                    },
                    {
                        role: 'user',
                        content: `Извлеки данные из этого резюме:\n\n${rawText}`,
                    },
                ],
                ProfileDataSchema,
                { model: this.llmGateway.getModels().fast, temperature: 0.1, timeoutMs: 60000 },
            );

            this.logger.log(`Successfully parsed resume for: ${result.data.fullName}`);
            return result.data;
        });
    }
}

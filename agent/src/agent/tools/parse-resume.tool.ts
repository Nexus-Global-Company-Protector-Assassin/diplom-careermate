import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { ProfileDataSchema, ParsedProfileData } from '../schemas/profile-data.schema';

@Injectable()
export class ParseResumeTool {
    private readonly logger = new Logger(ParseResumeTool.name);

    constructor(private readonly llmGateway: LlmGatewayService) { }

    async run(rawText: string): Promise<ParsedProfileData> {
        this.logger.log(`Starting to parse raw resume text (length: ${rawText.length})`);

        const result = await this.llmGateway.generateJson<ParsedProfileData>(
            [
                {
                    role: 'system',
                    content: `You are an expert HR data extractor. Your task is to extract structured profile information from unstructured resume text.
If the text is messy or malformed, do your best to reconstruct logic (e.g. deduce experience years).
If the desired role is not explicitly stated, figure it out based on the person's skills and most recent title.
Return output adhering to the requested JSON schema.`,
                },
                {
                    role: 'user',
                    content: `Here is the raw resume text:\n\n${rawText}`,
                },
            ],
            ProfileDataSchema,
            { temperature: 0.1, timeoutMs: 60000 }
        );

        this.logger.log(`Successfully parsed resume for: ${result.data.fullName}`);
        return result.data;
    }
}

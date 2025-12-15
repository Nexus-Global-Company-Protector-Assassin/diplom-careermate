import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgentService {
    private readonly logger = new Logger(AgentService.name);

    constructor(private readonly configService: ConfigService) {
        this.logger.log('AgentService initialized');
    }

    async processRequest(input: string): Promise<string> {
        this.logger.log(`Processing request: ${input}`);
        // TODO: Implement LLM interaction
        return `Processed: ${input}`;
    }
}

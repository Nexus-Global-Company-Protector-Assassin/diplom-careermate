import { Module } from '@nestjs/common';
import { AgentRunnerService } from './agent.service';
import { AgentController } from './agent.controller';
import { LlmGatewayService } from './llm/llm-gateway.service';
import { AnalyzeProfileTool } from './tools/analyze-profile.tool';
import { MatchVacanciesTool } from './tools/match-vacancies.tool';
import { GenerateResumeTool } from './tools/generate-resume.tool';
import { ParseResumeTool } from './tools/parse-resume.tool';
import { CacheService } from './cache/cache.service';
import { PineconeService } from './pinecone/pinecone.service';
import { FileParserService } from './parser/file-parser.service';
import { ReActAgentService } from './react-agent.service';

@Module({
    controllers: [AgentController],
    providers: [
        PineconeService,
        CacheService,
        LlmGatewayService,
        AnalyzeProfileTool,
        MatchVacanciesTool,
        GenerateResumeTool,
        ParseResumeTool,
        AgentRunnerService,
        FileParserService,
        ReActAgentService,
    ],
    exports: [AgentRunnerService, CacheService, PineconeService, ReActAgentService],
})
export class AgentModule { }

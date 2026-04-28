# LangChain/Agent Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw `httpService.post()` calls in `AiService` with proper LangChain chains using `ChatOpenAI`, `ChatPromptTemplate`, and LCEL pipelines — filling `ai/providers/` and `ai/langchain/` folders with real implementation.

**Architecture:** `LlmProviderService` (in `ai/providers/`) wraps `ChatOpenAI` with lazy initialization and config-driven base URL (OpenRouter/OpenAI/local). Four chain files (in `ai/langchain/`) each expose a typed `invoke(input)` method built from `ChatPromptTemplate.pipe(llm).pipe(parser)` LCEL pipeline. `AiService` delegates to chains when LLM is available, falls back to existing mock responses when `LLM_API_KEY` is absent — no change in observable behaviour.

**Tech Stack:** `@langchain/core ^0.1.x` (LCEL, prompts, output parsers), `langchain ^0.0.214` (`ChatOpenAI`), NestJS DI, Jest mocks.

---

### Task 1: LlmProviderService

**Files:**
- Create: `backend/src/modules/ai/providers/llm-provider.service.ts`
- Create: `backend/src/modules/ai/providers/llm-provider.service.spec.ts`

The service lazily creates a `ChatOpenAI` instance from config. Returns `null` when `LLM_API_KEY` is not set so callers can fall back to mock mode without exceptions.

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/modules/ai/providers/llm-provider.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmProviderService } from './llm-provider.service';

jest.mock('langchain/chat_models/openai', () => ({
    ChatOpenAI: jest.fn().mockImplementation((opts) => ({ modelName: opts.modelName, _type: 'openai' })),
}));

const makeConfig = (key: string | null) => ({
    get: jest.fn((k: string, def?: string) => {
        if (k === 'LLM_API_KEY') return key;
        if (k === 'LLM_API_BASE_URL') return 'https://openrouter.ai/api/v1';
        if (k === 'LLM_MODEL_NAME_SMART') return 'google/gemini-2.0-flash-001';
        return def ?? null;
    }),
});

describe('LlmProviderService', () => {
    let service: LlmProviderService;

    it('should be defined', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig('sk-test') }],
        }).compile();
        service = module.get<LlmProviderService>(LlmProviderService);
        expect(service).toBeDefined();
    });

    it('should return null when LLM_API_KEY is not set', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig(null) }],
        }).compile();
        service = module.get<LlmProviderService>(LlmProviderService);
        expect(service.chat).toBeNull();
    });

    it('should return ChatOpenAI instance when LLM_API_KEY is set', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig('sk-test') }],
        }).compile();
        service = module.get<LlmProviderService>(LlmProviderService);
        const chat = service.chat;
        expect(chat).not.toBeNull();
    });

    it('should return the same instance on repeated calls (lazy singleton)', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig('sk-test') }],
        }).compile();
        service = module.get<LlmProviderService>(LlmProviderService);
        expect(service.chat).toBe(service.chat);
    });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend && npx jest llm-provider.service.spec --no-coverage 2>&1 | tail -5
```

Expected: FAIL — `LlmProviderService` does not exist.

- [ ] **Step 3: Implement LlmProviderService**

```typescript
// backend/src/modules/ai/providers/llm-provider.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from 'langchain/chat_models/openai';

@Injectable()
export class LlmProviderService {
    private _chat: ChatOpenAI | null = null;

    constructor(private readonly config: ConfigService) {}

    get chat(): ChatOpenAI | null {
        const apiKey = this.config.get<string>('LLM_API_KEY');
        if (!apiKey) return null;
        if (!this._chat) {
            const baseURL = this.config.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
            const modelName = this.config.get<string>('LLM_MODEL_NAME_SMART', 'gpt-4o-mini');
            this._chat = new ChatOpenAI({
                openAIApiKey: apiKey,
                modelName,
                configuration: { baseURL },
            });
        }
        return this._chat;
    }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd backend && npx jest llm-provider.service.spec --no-coverage 2>&1 | tail -5
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/ai/providers/llm-provider.service.ts backend/src/modules/ai/providers/llm-provider.service.spec.ts
git commit -m "feat(langchain): add LlmProviderService wrapping ChatOpenAI with lazy init"
```

---

### Task 2: CareerChatChain

**Files:**
- Create: `backend/src/modules/ai/langchain/career-chat.chain.ts`
- Create: `backend/src/modules/ai/langchain/career-chat.chain.spec.ts`

LCEL chain: `ChatPromptTemplate → ChatOpenAI → StringOutputParser`. Wraps career consultant chat with the same system prompt as the legacy raw-HTTP implementation.

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/modules/ai/langchain/career-chat.chain.spec.ts
import { CareerChatChain } from './career-chat.chain';

const makeLlm = (output: string) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('CareerChatChain', () => {
    it('should invoke and return a string response', async () => {
        const chain = new CareerChatChain(makeLlm('Вот мой ответ') as any);
        const result = await chain.invoke({ message: 'помоги с резюме', context: '' });
        expect(typeof result).toBe('string');
        expect(result).toBe('Вот мой ответ');
    });

    it('should pass message and context into the chain', async () => {
        const invoke = jest.fn().mockResolvedValue('ok');
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new CareerChatChain(llm);
        await chain.invoke({ message: 'найди вакансию', context: 'Имя: Иван' });
        expect(invoke).toHaveBeenCalledWith({ message: 'найди вакансию', context: 'Имя: Иван' });
    });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend && npx jest career-chat.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: FAIL — `CareerChatChain` does not exist.

- [ ] **Step 3: Implement CareerChatChain**

```typescript
// backend/src/modules/ai/langchain/career-chat.chain.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

const SYSTEM = `Ты — умный карьерный консультант платформы CareerMate. Строго придерживайся своей роли. Твоя единственная цель: помогать с поиском работы, резюме, собеседованиями и развитием карьеры. Если пользователь задает вопросы или просит сделать что-то, не связанное с карьерой, работой, образованием, навыками или функционалом платформы, ты ДОЛЖЕН вежливо отказать и напомнить, что ты карьерный консультант CareerMate и обсуждаешь только профессиональное развитие. {context} Отвечай полезно, структурированно, профессионально. Пиши коротко и по делу.`;

const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM],
    ['human', '{message}'],
]);

export class CareerChatChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = prompt.pipe(llm as any).pipe(new StringOutputParser());
    }

    async invoke(input: { message: string; context: string }): Promise<string> {
        return this.chain.invoke(input);
    }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd backend && npx jest career-chat.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/ai/langchain/career-chat.chain.ts backend/src/modules/ai/langchain/career-chat.chain.spec.ts
git commit -m "feat(langchain): add CareerChatChain using LCEL ChatPromptTemplate + StringOutputParser"
```

---

### Task 3: VacancyAnalysisChain

**Files:**
- Create: `backend/src/modules/ai/langchain/vacancy-analysis.chain.ts`
- Create: `backend/src/modules/ai/langchain/vacancy-analysis.chain.spec.ts`

LCEL chain: `ChatPromptTemplate → ChatOpenAI → JsonOutputParser`. Accepts the vacancy analysis prompt variables and returns the structured JSON object (grades, sections, ghost job detection).

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/modules/ai/langchain/vacancy-analysis.chain.spec.ts
import { VacancyAnalysisChain } from './vacancy-analysis.chain';

const mockAnalysis = { A_Summary: 'ok', grade: 'B', score: 75, G_Legitimacy: { verdict: 'High Confidence', signals: [], explanation: '' } };

const makeLlm = (output: object) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('VacancyAnalysisChain', () => {
    it('should invoke and return a JSON object', async () => {
        const chain = new VacancyAnalysisChain(makeLlm(mockAnalysis) as any);
        const result = await chain.invoke({ prompt: 'анализируй вакансию' });
        expect(result).toEqual(mockAnalysis);
        expect(result.grade).toBe('B');
    });

    it('should pass the prompt variable into chain invoke', async () => {
        const invoke = jest.fn().mockResolvedValue(mockAnalysis);
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new VacancyAnalysisChain(llm);
        await chain.invoke({ prompt: 'test prompt text' });
        expect(invoke).toHaveBeenCalledWith({ prompt: 'test prompt text' });
    });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend && npx jest vacancy-analysis.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Implement VacancyAnalysisChain**

```typescript
// backend/src/modules/ai/langchain/vacancy-analysis.chain.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Ты — строгий карьерный консультант платформы CareerMate. Проводишь аудит вакансий включая Ghost Job Detection (Block G). Отвечай только валидным JSON без markdown.'],
    ['human', '{prompt}'],
]);

export class VacancyAnalysisChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = prompt.pipe(llm as any).pipe(new JsonOutputParser());
    }

    async invoke(input: { prompt: string }): Promise<any> {
        return this.chain.invoke(input);
    }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd backend && npx jest vacancy-analysis.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/ai/langchain/vacancy-analysis.chain.ts backend/src/modules/ai/langchain/vacancy-analysis.chain.spec.ts
git commit -m "feat(langchain): add VacancyAnalysisChain using LCEL + JsonOutputParser"
```

---

### Task 4: InterviewPrepChain

**Files:**
- Create: `backend/src/modules/ai/langchain/interview-prep.chain.ts`
- Create: `backend/src/modules/ai/langchain/interview-prep.chain.spec.ts`

LCEL chain: `ChatPromptTemplate → ChatOpenAI → JsonOutputParser`. Accepts the STAR+R interview prep prompt and returns structured questions array.

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/modules/ai/langchain/interview-prep.chain.spec.ts
import { InterviewPrepChain } from './interview-prep.chain';

const mockPrep = { questions: [{ question: 'Расскажите о себе', category: 'behavioral', star: {} }], candidate_questions: ['Вопрос 1'], tips: 'Совет' };

const makeLlm = (output: object) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('InterviewPrepChain', () => {
    it('should invoke and return structured interview prep JSON', async () => {
        const chain = new InterviewPrepChain(makeLlm(mockPrep) as any);
        const result = await chain.invoke({ prompt: 'подготовь вопросы' });
        expect(result).toEqual(mockPrep);
        expect(Array.isArray(result.questions)).toBe(true);
    });

    it('should pass the prompt variable into chain invoke', async () => {
        const invoke = jest.fn().mockResolvedValue(mockPrep);
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new InterviewPrepChain(llm);
        await chain.invoke({ prompt: 'test prompt' });
        expect(invoke).toHaveBeenCalledWith({ prompt: 'test prompt' });
    });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend && npx jest interview-prep.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Implement InterviewPrepChain**

```typescript
// backend/src/modules/ai/langchain/interview-prep.chain.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Ты — эксперт по подготовке к собеседованиям платформы CareerMate. Генерируй структурированные ответы по методу STAR+R. Отвечай только валидным JSON.'],
    ['human', '{prompt}'],
]);

export class InterviewPrepChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = prompt.pipe(llm as any).pipe(new JsonOutputParser());
    }

    async invoke(input: { prompt: string }): Promise<any> {
        return this.chain.invoke(input);
    }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd backend && npx jest interview-prep.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/ai/langchain/interview-prep.chain.ts backend/src/modules/ai/langchain/interview-prep.chain.spec.ts
git commit -m "feat(langchain): add InterviewPrepChain using LCEL + JsonOutputParser"
```

---

### Task 5: CoverLetterChain

**Files:**
- Create: `backend/src/modules/ai/langchain/cover-letter.chain.ts`
- Create: `backend/src/modules/ai/langchain/cover-letter.chain.spec.ts`

LCEL chain: `ChatPromptTemplate → ChatOpenAI → StringOutputParser`. Accepts the cover letter prompt (already fully composed in AiService) and returns plain text.

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/modules/ai/langchain/cover-letter.chain.spec.ts
import { CoverLetterChain } from './cover-letter.chain';

const makeLlm = (output: string) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('CoverLetterChain', () => {
    it('should invoke and return cover letter text', async () => {
        const chain = new CoverLetterChain(makeLlm('Уважаемый HR!') as any);
        const result = await chain.invoke({ systemPrompt: 'system', prompt: 'user prompt' });
        expect(typeof result).toBe('string');
        expect(result).toBe('Уважаемый HR!');
    });

    it('should pass systemPrompt and prompt into chain invoke', async () => {
        const invoke = jest.fn().mockResolvedValue('letter');
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new CoverLetterChain(llm);
        await chain.invoke({ systemPrompt: 'sys', prompt: 'usr' });
        expect(invoke).toHaveBeenCalledWith({ systemPrompt: 'sys', prompt: 'usr' });
    });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend && npx jest cover-letter.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Implement CoverLetterChain**

```typescript
// backend/src/modules/ai/langchain/cover-letter.chain.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

const prompt = ChatPromptTemplate.fromMessages([
    ['system', '{systemPrompt}'],
    ['human', '{prompt}'],
]);

export class CoverLetterChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = prompt.pipe(llm as any).pipe(new StringOutputParser());
    }

    async invoke(input: { systemPrompt: string; prompt: string }): Promise<string> {
        return this.chain.invoke(input);
    }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd backend && npx jest cover-letter.chain.spec --no-coverage 2>&1 | tail -5
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/ai/langchain/cover-letter.chain.ts backend/src/modules/ai/langchain/cover-letter.chain.spec.ts
git commit -m "feat(langchain): add CoverLetterChain using LCEL + StringOutputParser"
```

---

### Task 6: Refactor AiService to use chains

**Files:**
- Modify: `backend/src/modules/ai/ai.service.ts`
- Modify: `backend/src/modules/ai/ai.service.spec.ts`

Replace all `httpService.post()` calls with the corresponding chain. Remove `HttpService` dependency. Keep mock fallback when `LlmProviderService.chat` is `null`. All existing mock-mode tests continue passing.

- [ ] **Step 1: Update ai.service.spec.ts**

Replace the existing spec with this version that mocks `LlmProviderService` instead of `HttpService`:

```typescript
// backend/src/modules/ai/ai.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { LlmProviderService } from './providers/llm-provider.service';

const makeConfig = () => ({ get: jest.fn().mockReturnValue(null) });
const makePrisma = () => ({ profile: { findFirst: jest.fn().mockResolvedValue(null) } });
const makeLlmProvider = () => ({ chat: null }); // null → mock mode

describe('AiService', () => {
    let service: AiService;

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiService,
                { provide: ConfigService, useValue: makeConfig() },
                { provide: PrismaService, useValue: makePrisma() },
                { provide: LlmProviderService, useValue: makeLlmProvider() },
            ],
        }).compile();

        service = module.get<AiService>(AiService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateResponse (mock mode — no LLM)', () => {
        it('should return resume advice when message contains "резюме"', async () => {
            const result = await service.generateResponse('хочу улучшить резюме');
            expect(result).toContain('Для улучшения резюме');
        });

        it('should return interview advice when message contains "собеседован"', async () => {
            const result = await service.generateResponse('как пройти собеседование');
            expect(result).toContain('Подготовка к собеседованию');
        });

        it('should return vacancy advice when message contains "вакансии"', async () => {
            const result = await service.generateResponse('ищу вакансии');
            expect(result).toContain('На основе вашего профиля');
        });

        it('should return vacancy advice when message contains "работ"', async () => {
            const result = await service.generateResponse('ищу работу');
            expect(result).toContain('На основе вашего профиля');
        });

        it('should return default response for unrecognized messages', async () => {
            const result = await service.generateResponse('что-то непонятное');
            expect(result).toContain('Интересный вопрос!');
        });

        it('should always return a non-empty string', async () => {
            const result = await service.generateResponse('любой текст');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('evaluateVacancyInDepth (mock mode — no LLM)', () => {
        it('should return mock evaluation object with required fields', async () => {
            const vacancy = { title: 'Backend Dev', employer: 'Acme', createdAt: new Date().toISOString(), salaryLabel: '150k', experience: '3y', schedule: 'Remote', descriptionPreview: 'Build APIs', skills: ['Node.js'] };
            const result = await service.evaluateVacancyInDepth(vacancy, 'resume text', 'Backend', ['Docker']);
            expect(result).toHaveProperty('A_Summary');
            expect(result).toHaveProperty('grade');
            expect(result).toHaveProperty('score');
            expect(result.G_Legitimacy).toHaveProperty('verdict');
        });
    });

    describe('generateInterviewPrep (mock mode — no LLM)', () => {
        it('should return mock prep with questions array', async () => {
            const result = await service.generateInterviewPrep({ title: 'Dev', employer: 'Corp' }, 'my resume');
            expect(Array.isArray(result.questions)).toBe(true);
            expect(Array.isArray(result.candidate_questions)).toBe(true);
        });
    });

    describe('generateCoverLetter (mock mode — no LLM)', () => {
        it('should return mock cover letter object with coverLetter string', async () => {
            const result = await service.generateCoverLetter({ title: 'Dev', employer: 'Corp' }, 'my resume', 'ru');
            expect(typeof result.coverLetter).toBe('string');
            expect(result.coverLetter.length).toBeGreaterThan(0);
        });

        it('should return English mock when language is en', async () => {
            const result = await service.generateCoverLetter({ title: 'Dev', employer: 'Corp' }, 'my resume', 'en');
            expect(result.coverLetter).toContain('[Mock Mode');
        });
    });
});
```

- [ ] **Step 2: Run existing spec to confirm it fails (HttpService removed)**

```bash
cd backend && npx jest ai.service.spec --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `HttpService` is expected in providers but missing, or `LlmProviderService` not found.

- [ ] **Step 3: Rewrite ai.service.ts using chains**

Replace the entire file:

```typescript
// backend/src/modules/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { LlmProviderService } from './providers/llm-provider.service';
import { CareerChatChain } from './langchain/career-chat.chain';
import { VacancyAnalysisChain } from './langchain/vacancy-analysis.chain';
import { InterviewPrepChain } from './langchain/interview-prep.chain';
import { CoverLetterChain } from './langchain/cover-letter.chain';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly llmProvider: LlmProviderService,
    ) {}

    async generateResponse(message: string): Promise<string> {
        const llm = this.llmProvider.chat;
        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked response.');
            return this.getMockResponse(message);
        }

        try {
            let context = '';
            const profile = await this.prisma.profile.findFirst();
            if (profile) {
                context = `Контекст пользователя: Меня зовут ${profile.fullName || 'Кандидат'}. Ищу работу на позицию: ${profile.desiredPosition || 'Разработчик'}. Обо мне: ${profile.aboutMe || ''}. Навыки: ${JSON.stringify(profile.skills) || ''}.`;
            }
            const chain = new CareerChatChain(llm);
            return await chain.invoke({ message, context });
        } catch (error: any) {
            this.logger.error(`LLM Error: ${error.message}`);
            return 'Произошла ошибка при обращении к серверу AI. Пожалуйста, проверьте ключ или попробуйте позже.';
        }
    }

    private getMockResponse(message: string): string {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('резюме')) {
            return 'Для улучшения резюме рекомендую:\n\n1. Добавьте конкретные достижения с цифрами\n2. Используйте ключевые слова из вакансий\n3. Проверьте грамматику и оформление\n4. Добавьте релевантные навыки\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
        }
        if (lowerMessage.includes('собеседован')) {
            return 'Подготовка к собеседованию включает:\n\n1. Изучите компанию и продукт\n2. Подготовьте рассказ о себе (1-2 минуты)\n3. Практикуйте ответы на типичные вопросы\n4. Подготовьте вопросы для работодателя\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
        }
        if (lowerMessage.includes('вакансии') || lowerMessage.includes('работ')) {
            return 'На основе вашего профиля могу порекомендовать:\n\n• Senior Data Analyst в Yandex (93% совместимость)\n• Data Analyst в Sber (81% совместимость)\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
        }
        return 'Интересный вопрос! Я могу помочь вам с:\n\n• Анализом и улучшением резюме\n• Подготовкой к собеседованию\n• Поиском вакансий по вашему профилю\n• Карьерными рекомендациями\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
    }

    async evaluateVacancyInDepth(vacancy: any, resumeContent: string, archetype?: string, missingSkills?: string[]): Promise<any> {
        const daysOld = vacancy.createdAt
            ? Math.floor((Date.now() - new Date(vacancy.createdAt).getTime()) / 86400000)
            : null;
        const freshnessNote = daysOld !== null
            ? `Вакансия опубликована ${daysOld} дн. назад.${daysOld > 60 ? ' ⚠️ Очень старая — высокий риск ghost job.' : daysOld > 30 ? ' Устаревает.' : ' Свежая.'}`
            : 'Дата публикации неизвестна.';

        const archetypeNote = archetype && archetype !== 'Unknown' ? `Тип роли: ${archetype}.` : '';
        const gapNote = missingSkills?.length ? `Навыки которых нет у кандидата: ${missingSkills.join(', ')}.` : '';

        const llm = this.llmProvider.chat;
        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked deep evaluation.');
            const mockScore = 50 + Math.floor(Math.random() * 40);
            const mockGrade = mockScore >= 80 ? 'A' : mockScore >= 65 ? 'B' : mockScore >= 50 ? 'C' : 'D';
            return {
                A_Summary: `[Mock] Архетип: ${archetype || 'Unknown'}. Роль: ${vacancy?.title} в ${vacancy?.employer}.`,
                B_CV_Match: `[Mock] Gaps: ${missingSkills?.join(', ') || 'не определены'}.`,
                C_Strategy: '[Mock] Акцентируйте достижения с конкретными метриками.',
                D_Compensation: `[Mock] ${vacancy?.salaryLabel || 'Зарплата не указана'}. Просите верхнюю границу.`,
                E_Personalization: '[Mock] Добавьте ключевые слова из JD в summary резюме.',
                F_Interview: '[Mock] Подготовьте STAR-историю о сложном проекте с измеримым результатом.',
                G_Legitimacy: {
                    verdict: mockScore > 85 ? 'High Confidence' : mockScore > 60 ? 'Proceed with Caution' : 'Suspicious',
                    signals: mockScore > 85
                        ? ['Свежая вакансия (< 3 дней)', 'Детальное описание стека', 'Указана рыночная ЗП']
                        : mockScore > 60
                            ? ['Размытое описание задач', 'Отсутствует зарплата']
                            : ['Вечнозеленая вакансия (обновляется 3+ месяца)', 'Требования Junior+, опыт 5+ лет', 'Слишком общие фразы'],
                    explanation: mockScore > 85
                        ? 'Вакансия выглядит реальной и проработанной.'
                        : mockScore > 60
                            ? 'Есть небольшие сомнения из-за недостатка конкретики.'
                            : 'Высокий риск Ghost Job! Описание типично для сбора базы резюме.',
                },
                archetype: archetype || 'Unknown',
                grade: mockGrade,
                score: mockScore,
            };
        }

        const vacancyText = [
            `Вакансия: ${vacancy?.title}`, `Работодатель: ${vacancy?.employer}`,
            `Зарплата: ${vacancy?.salaryLabel}`, `Опыт: ${vacancy?.experience}`,
            `Формат: ${vacancy?.schedule}`, `Описание: ${vacancy?.descriptionPreview || ''}`,
            `Навыки: ${JSON.stringify(vacancy?.skills || [])}`,
            archetypeNote, gapNote, freshnessNote,
        ].filter(Boolean).join('\n');

        const prompt = `Проведи глубокий анализ вакансии для кандидата (7 блоков):

A_Summary) Краткое резюме роли: архетип, домен, уровень, формат, TL;DR в 1 предложении.
B_CV_Match) Совпадение с CV: сопоставь каждое ключевое требование JD с опытом кандидата. Укажи gaps и стратегию их закрытия.
C_Strategy) Как кандидату продать себя без преувеличений. Конкретные формулировки.
D_Compensation) Адекватность зарплаты рынку. Рекомендации по переговорам.
E_Personalization) Топ-5 конкретных изменений в резюме под эту вакансию.
F_Interview) 3-5 STAR+R историй из опыта кандидата под требования вакансии.
G_Legitimacy) Ghost Job Detection — оцени реальность вакансии:
  - Свежесть: ${freshnessNote}
  - Размытость (Vagueness): Насколько общими фразами описана работа?
  - Unicorn Requirements: Не ищут ли они джуниора с 5+ годами опыта?
  - Есть ли явные упоминания команды, процессов работы?
  - Зарплата указана? (позитивный сигнал)
  Вердикт: "High Confidence", "Proceed with Caution" или "Suspicious". В поле signals перечисли конкретные найденные флаги.

ОЦЕНИВАЙ ЧЕСТНО. GRADE от A до F. Score 0-100.

Верни ТОЛЬКО валидный JSON без markdown:
{
  "A_Summary": "...", "B_CV_Match": "...", "C_Strategy": "...", "D_Compensation": "...",
  "E_Personalization": "...", "F_Interview": "...",
  "G_Legitimacy": { "verdict": "High Confidence | Proceed with Caution | Suspicious", "signals": [], "explanation": "..." },
  "archetype": "${archetype || 'Unknown'}", "grade": "A|B|C|D|F", "score": 85
}

Резюме кандидата:
${resumeContent}

${vacancyText}`;

        try {
            const chain = new VacancyAnalysisChain(llm);
            return await chain.invoke({ prompt });
        } catch (error: any) {
            this.logger.error(`LLM Error: ${error.message}`);
            return {
                A_Summary: 'Ошибка генерации оценки', B_CV_Match: 'Не удалось проанализировать из-за ошибки LLM',
                C_Strategy: 'Обратитесь к администратору', D_Compensation: 'N/A',
                E_Personalization: 'N/A', F_Interview: 'N/A',
                G_Legitimacy: { verdict: 'Proceed with Caution', signals: ['Ошибка LLM'], explanation: 'Ghost Job Detection недоступен' },
                archetype: archetype || 'Unknown', grade: 'F', score: 0,
            };
        }
    }

    async generateInterviewPrep(vacancy: any, resumeContent: string): Promise<any> {
        const llm = this.llmProvider.chat;
        const vacancyText = `Вакансия: ${vacancy?.title} в ${vacancy?.employer}. Описание: ${vacancy?.descriptionPreview || ''}. Навыки: ${JSON.stringify(vacancy?.skills || [])}. Опыт: ${vacancy?.experience}. Формат: ${vacancy?.schedule}.`;

        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked interview prep.');
            return {
                questions: [{ question: 'Mock: Расскажите о сложном проекте', category: 'behavioral', star: { situation: 'Mock ситуация', task: 'Mock задача', action: 'Mock действия', result: 'Mock результат', reflection: 'Mock вывод' } }],
                candidate_questions: ['Mock: Какие технологии вы используете?', 'Mock: Какая структура команды?', 'Mock: Какие цели на год?'],
                tips: 'Mock: Добавьте LLM_API_KEY в .env для реальной генерации',
            };
        }

        const prompt = `Ты — эксперт по подготовке к собеседованиям. На основе резюме кандидата и описания вакансии, сгенерируй банк историй для собеседования по методу STAR+R.

Резюме кандидата:
${resumeContent}

${vacancyText}

ЗАДАЧА:
1. Предскажи 5 наиболее вероятных вопросов, которые зададут на собеседовании для данной позиции
2. Для каждого вопроса составь готовый ответ по методу STAR+R:
   - S (Situation) — описание ситуации из опыта кандидата
   - T (Task) — задача, которая стояла
   - A (Action) — конкретные действия кандидата
   - R (Result) — результат с цифрами/метриками
   - R+ (Reflection) — что кандидат вынес из этого опыта
3. Добавь 3 вопроса, которые кандидат должен задать работодателю

ВЕРНИ ОТВЕТ СТРОГО В ВИДЕ JSON:
{
  "questions": [{ "question": "...", "category": "behavioral|technical|situational", "star": { "situation": "...", "task": "...", "action": "...", "result": "...", "reflection": "..." } }],
  "candidate_questions": ["...", "...", "..."],
  "tips": "..."
}

Отвечай только валидным JSON без маркдаун-блоков.`;

        try {
            const chain = new InterviewPrepChain(llm);
            return await chain.invoke({ prompt });
        } catch (error: any) {
            this.logger.error(`LLM Error generating interview prep: ${error.message}`);
            return { questions: [], candidate_questions: [], tips: 'Ошибка генерации. Попробуйте позже.' };
        }
    }

    async generateCoverLetter(vacancy: any, resumeContent: string, language: 'ru' | 'en' = 'ru'): Promise<{ coverLetter: string }> {
        const llm = this.llmProvider.chat;
        const isEn = language === 'en';

        const vacancyText = isEn
            ? [`Position: ${vacancy?.title}`, `Employer: ${vacancy?.employer}`, `Location: ${vacancy?.location || 'Not specified'}`, `Salary: ${vacancy?.salaryLabel || 'Not specified'}`, `Format: ${vacancy?.schedule || 'Not specified'}`, `Job description: ${vacancy?.descriptionPreview || ''}`, `Required skills: ${JSON.stringify(vacancy?.skills || [])}`].join('\n')
            : [`Должность: ${vacancy?.title}`, `Работодатель: ${vacancy?.employer}`, `Местоположение: ${vacancy?.location || 'Не указано'}`, `Зарплата: ${vacancy?.salaryLabel || 'Не указана'}`, `Формат: ${vacancy?.schedule || 'Не указан'}`, `Описание вакансии: ${vacancy?.descriptionPreview || ''}`, `Требуемые навыки: ${JSON.stringify(vacancy?.skills || [])}`].join('\n');

        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked cover letter.');
            const mockLetter = isEn
                ? `Good day!\n\nI am excited to apply for the ${vacancy?.title} position at ${vacancy?.employer}. My experience and skills closely match the requirements.\n\n[Mock Mode — add LLM_API_KEY to .env for personalized generation]`
                : `Добрый день!\n\nМеня заинтересовала вакансия ${vacancy?.title} в компании ${vacancy?.employer}. Мой опыт и навыки хорошо соответствуют описанным требованиям.\n\n[Mock Mode — добавьте LLM_API_KEY в .env для персонализированной генерации]`;
            return { coverLetter: mockLetter };
        }

        const systemPrompt = isEn
            ? "You are a professional career consultant at CareerMate platform. You write personalized cover letters based on the candidate's resume and job description. Reply with the letter text only — no markdown, no comments."
            : 'Ты — профессиональный карьерный консультант платформы CareerMate. Пишешь персонализированные сопроводительные письма на основе резюме кандидата и описания вакансии. Отвечай только текстом письма без markdown и комментариев.';

        const prompt = isEn
            ? `You are a professional career consultant. Write a personalized cover letter in English.\n\nJOB DETAILS:\n${vacancyText}\n\nCANDIDATE RESUME:\n${resumeContent}\n\nLength: 3-4 paragraphs. Tone: professional yet genuine. Return ONLY the cover letter text.`
            : `Ты — профессиональный карьерный консультант. Напиши персонализированное сопроводительное письмо на русском языке.\n\nДАННЫЕ ВАКАНСИИ:\n${vacancyText}\n\nРЕЗЮМЕ КАНДИДАТА:\n${resumeContent}\n\nОбъём: 3-4 абзаца. Верни ТОЛЬКО текст письма.`;

        try {
            const chain = new CoverLetterChain(llm);
            const coverLetter = await chain.invoke({ systemPrompt, prompt });
            return { coverLetter: coverLetter.trim() };
        } catch (error: any) {
            this.logger.error(`LLM Error generating cover letter: ${error.message}`);
            const fallback = isEn
                ? `Dear Hiring Team,\n\nI am writing to express my interest in the ${vacancy?.title} position at ${vacancy?.employer}.\n\nBest regards`
                : `Добрый день!\n\nХочу откликнуться на вакансию ${vacancy?.title} в компании ${vacancy?.employer}.\n\nС уважением`;
            return { coverLetter: fallback };
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npx jest ai.service.spec --no-coverage 2>&1 | tail -10
```

Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/ai/ai.service.ts backend/src/modules/ai/ai.service.spec.ts
git commit -m "refactor(langchain): replace httpService calls with LangChain LCEL chains in AiService"
```

---

### Task 7: Wire LlmProviderService into AiModule and run full suite

**Files:**
- Modify: `backend/src/modules/ai/ai.module.ts`

Register `LlmProviderService` as a provider so NestJS DI resolves it for `AiService`. Remove `HttpModule` (no longer needed by AiService). Run all tests to confirm no regressions.

- [ ] **Step 1: Update AiModule**

```typescript
// backend/src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../../database/database.module';
import { LlmProviderService } from './providers/llm-provider.service';

@Module({
    imports: [DatabaseModule],
    controllers: [AiController],
    providers: [AiService, LlmProviderService],
    exports: [AiService],
})
export class AiModule {}
```

- [ ] **Step 2: Run the full test suite**

```bash
cd backend && npx jest --no-coverage 2>&1 | tail -20
```

Expected: All test suites pass, no regressions.

- [ ] **Step 3: TypeScript check**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/ai/ai.module.ts
git commit -m "feat(langchain): register LlmProviderService in AiModule; remove HttpModule from AI"
```

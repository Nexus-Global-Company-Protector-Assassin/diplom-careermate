import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

describe('AiService', () => {
    let service: AiService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AiService],
        }).compile();

        service = module.get<AiService>(AiService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate resume response', () => {
        const result = service.generateResponse('хочу улучшить резюме');
        expect(result).toContain('Для улучшения резюме рекомендую');
    });

    it('should generate interview response', () => {
        const result = service.generateResponse('как пройти собеседование');
        expect(result).toContain('Подготовка к собеседованию');
    });

    it('should generate vacancy response', () => {
        const result = service.generateResponse('ищу работу');
        expect(result).toContain('На основе вашего профиля могу порекомендовать');
    });

    it('should generate default response', () => {
        const result = service.generateResponse('что-то непонятное');
        expect(result).toContain('Интересный вопрос!');
    });
});

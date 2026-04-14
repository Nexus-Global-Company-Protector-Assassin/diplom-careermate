import { Test, TestingModule } from '@nestjs/testing';
import { FileParserService } from './file-parser.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'parsed pdf text' }));
jest.mock('mammoth', () => ({
    extractRawText: jest.fn().mockResolvedValue({ value: 'parsed docx text' })
}));

describe('FileParserService', () => {
    let service: FileParserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FileParserService],
        }).compile();

        service = module.get<FileParserService>(FileParserService);
    });

    it('should successfully extract text from PDF', async () => {
        const buffer = Buffer.from('mock pdf');
        const result = await service.extractText(buffer, 'application/pdf');
        expect(result).toEqual('parsed pdf text');
    });

    it('should successfully extract text from DOCX', async () => {
        const buffer = Buffer.from('mock docx');
        const result = await service.extractText(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(result).toEqual('parsed docx text');
    });

    it('should throw an error for unsupported mimetype', async () => {
        const buffer = Buffer.from('img');
        await expect(service.extractText(buffer, 'image/png')).rejects.toThrow('Не удалось извлечь текст');
    });
});

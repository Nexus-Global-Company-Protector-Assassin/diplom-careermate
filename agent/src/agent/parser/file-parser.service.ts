import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class FileParserService {
    private readonly logger = new Logger(FileParserService.name);

    /**
     * Извлекает текст из буфера файла. Поддерживает PDF и DOCX.
     */
    async extractText(buffer: Buffer, mimetype: string): Promise<string> {
        try {
            this.logger.log(`Parsing file with mimetype: ${mimetype}`);

            if (mimetype === 'application/pdf') {
                const data = await pdfParse(buffer);
                return data.text;
            }

            if (
                mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                mimetype === 'application/msword'
            ) {
                const data = await mammoth.extractRawText({ buffer });
                return data.value;
            }

            throw new Error(`Unsupported mimetype: ${mimetype}`);
        } catch (e) {
            this.logger.error(`Failed to parse file: ${(e as Error).message}`);
            throw new Error('Не удалось извлечь текст из файла резюме.');
        }
    }
}

import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
    describe('without RESEND_API_KEY (dev mode)', () => {
        let service: MailService;
        let logSpy: jest.SpyInstance;

        beforeEach(() => {
            const config = {
                get: (k: string) => (k === 'RESEND_FROM_EMAIL' ? 'CareerMate <test@test.com>' : undefined),
            } as unknown as ConfigService;
            service = new MailService(config);
            logSpy = jest.spyOn((service as any).logger, 'log').mockImplementation(() => {});
        });

        afterEach(() => {
            logSpy.mockRestore();
        });

        it('logs the code instead of sending when API key is missing', async () => {
            await service.sendVerificationCode('user@test.com', '123456');
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('123456'));
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user@test.com'));
        });

        it('treats placeholder API key as disabled', async () => {
            const config = {
                get: (k: string) => (k === 'RESEND_API_KEY' ? 'your-resend-api-key' : undefined),
            } as unknown as ConfigService;
            const s = new MailService(config);
            const ls = jest.spyOn((s as any).logger, 'log').mockImplementation(() => {});
            await s.sendVerificationCode('foo@bar.com', '654321');
            expect(ls).toHaveBeenCalledWith(expect.stringContaining('654321'));
            ls.mockRestore();
        });
    });

    describe('with RESEND_API_KEY', () => {
        it('builds verification HTML containing the code', () => {
            const config = { get: () => undefined } as unknown as ConfigService;
            const service = new MailService(config);
            const html = (service as any).buildVerificationHtml('999000') as string;
            expect(html).toContain('999000');
            expect(html).toContain('CareerMate');
        });
    });
});

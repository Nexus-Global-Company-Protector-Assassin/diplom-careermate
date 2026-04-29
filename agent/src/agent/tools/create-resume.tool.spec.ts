import { CreateResumeTool } from './create-resume.tool';
import { ProfileData } from './analyze-profile.tool';

describe('CreateResumeTool.buildProfileContext', () => {
    // Access the private method via cast for test purposes
    const tool = new CreateResumeTool({} as any);
    const buildContext = (p: ProfileData) =>
        (tool as any).buildProfileContext(p) as string;

    it('includes email and phone in a dedicated Контакты block', () => {
        const ctx = buildContext({
            fullName: 'Иван Иванов',
            email: 'ivan@example.com',
            phone: '+7 999 000 00 00',
        });

        expect(ctx).toContain('Контакты:');
        expect(ctx).toContain('Email: ivan@example.com');
        expect(ctx).toContain('Телефон: +7 999 000 00 00');
    });

    it('includes linkedin, github, telegram, location, portfolio when provided', () => {
        const ctx = buildContext({
            fullName: 'Иван Иванов',
            location: 'Москва',
            linkedinUrl: 'linkedin.com/in/ivan',
            githubUrl: 'github.com/ivan',
            telegram: '@ivan',
            portfolioUrl: 'ivan.dev',
        });

        expect(ctx).toContain('Локация: Москва');
        expect(ctx).toContain('LinkedIn: linkedin.com/in/ivan');
        expect(ctx).toContain('GitHub: github.com/ivan');
        expect(ctx).toContain('Telegram: @ivan');
        expect(ctx).toContain('Портфолио: ivan.dev');
    });

    it('omits Контакты block entirely when no contact fields are present', () => {
        const ctx = buildContext({
            fullName: 'Иван Иванов',
            desiredPosition: 'Frontend Developer',
        });

        expect(ctx).not.toContain('Контакты:');
        expect(ctx).toContain('ФИО: Иван Иванов');
    });

    it('keeps aboutMe as a separate section under "О себе"', () => {
        const ctx = buildContext({
            fullName: 'Иван Иванов',
            email: 'ivan@example.com',
            aboutMe: 'Опытный разработчик с фокусом на DX',
        });

        expect(ctx).toContain('Email: ivan@example.com');
        expect(ctx).toContain('О себе / доп. информация: Опытный разработчик с фокусом на DX');
    });

    it('emits each contact line independently — partial fields work', () => {
        const ctx = buildContext({
            fullName: 'Иван',
            phone: '+7 999 111 22 33',
        });

        expect(ctx).toContain('Контакты:');
        expect(ctx).toContain('Телефон: +7 999 111 22 33');
        expect(ctx).not.toContain('Email:');
        expect(ctx).not.toContain('LinkedIn:');
    });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ResumesService {
    constructor(private readonly prisma: PrismaService) {}

    // For PoC we use the first available Profile
    private async getProfileId() {
        const profile = await this.prisma.profile.findFirst();
        if (!profile) {
            throw new NotFoundException('Должен существовать хотя бы один профиль (demo user)');
        }
        return profile.id;
    }

    async getHistory() {
        const profileId = await this.getProfileId();
        
        const resumes = await this.prisma.resume.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' }
        });

        const history = await this.prisma.vacancyResponse.findMany({
            where: { profileId },
            orderBy: { responseDate: 'desc' }
        });

        // Translate the DB schema to the frontend expected schema:
        const mappedResumes = resumes.map(r => ({
            id: r.id,
            title: r.title,
            subtitle: r.subtitle || '',
            content: r.content,
            updated: r.updatedAt.toLocaleDateString("ru-RU"),
            status: r.status === 'active' ? 'Активное' : r.status === 'draft' ? 'Черновик' : 'Устаревшее',
            statusColor: r.status === 'active' 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : r.status === 'draft'
                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        }));

        const mappedHistory = history.map(h => ({
            id: h.id,
            name: h.position,
            company: h.company,
            date: h.responseDate.toLocaleDateString("ru-RU"),
            status: h.status === 'sent' ? 'Отправлено' : h.status === 'invited' ? 'Приглашение' : h.status === 'rejected' ? 'Отказ' : 'Загружено',
            statusColor: h.statusColor,
        }));

        return {
            resumes: mappedResumes,
            history: mappedHistory
        };
    }

    async generateCoverLetter(company: string, position: string, keyPoints?: string, profile?: any) {
        const name = profile?.fullName || "Пользователь";
        const email = profile?.aboutMe?.match(/Email:\s*(.*)/)?.[1] || "user@example.com";
        const phone = profile?.phone || "+7 (000) 000-00-00";

        const text = `Уважаемый HR-менеджер компании ${company}!

Я с большим интересом ознакомился с вакансией "${position}" и хотел бы предложить свою кандидатуру на данную позицию.

Имея глубокий опыт и релевантные навыки, я уверен, что смогу внести значительный вклад в развитие вашей команды.

Мои ключевые компетенции отлично совпадают с вашими требованиями.

${keyPoints ? `\nДополнительно хочу отметить: ${keyPoints}\n` : ""}
Буду рад возможности обсудить, как мой опыт может быть полезен для ${company}. Готов предоставить дополнительную информацию и ответить на любые вопросы.

(Сгенерировано бэкендом)

С уважением,
${name}
${email} | ${phone}`;

        // Additionally, for the PoC, we save it as a draft Cover Letter to the DB:
        try {
            const profileId = await this.getProfileId();
            await this.prisma.resume.create({
                data: {
                    profileId,
                    title: `Сопроводительное: ${company}`,
                    subtitle: `Позиция: ${position}`,
                    content: text,
                    type: 'cover_letter',
                    status: 'draft'
                }
            });
        } catch (e) {
            // ignore if no profile
        }

        return text;
    }

    async saveResume(title: string, subtitle?: string, content?: string, type: string = 'resume') {
        const profileId = await this.getProfileId();
        const resume = await this.prisma.resume.create({
            data: {
                profileId,
                title,
                subtitle: subtitle || '',
                content: content || '[Документ загружен. Просмотр файла в разработке]',
                type,
                status: 'draft'
            }
        });
        return resume;
    }

    async deleteResume(id: string) {
        const profileId = await this.getProfileId();
        await this.prisma.resume.deleteMany({
            where: { id, profileId }
        });
        return { success: true };
    }
}

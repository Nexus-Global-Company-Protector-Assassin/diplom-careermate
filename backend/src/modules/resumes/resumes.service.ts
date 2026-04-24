import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ResumesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly aiService: AiService,
    ) {}

    private async getProfileIdForUser(userId: string): Promise<string> {
        const profile = await this.prisma.profile.findFirst({ where: { userId } });
        if (!profile) {
            throw new NotFoundException('Профиль не найден');
        }
        return profile.id;
    }

    async getHistory(userId: string) {
        const profileId = await this.getProfileIdForUser(userId);

        const resumes = await this.prisma.resume.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' }
        });

        const history = await this.prisma.vacancyResponse.findMany({
            where: { profileId },
            orderBy: { responseDate: 'desc' }
        });

        const mappedResumes = resumes.map(r => ({
            id: r.id,
            title: r.title,
            subtitle: r.subtitle || '',
            content: r.content,
            reviewData: r.reviewData || null,
            fileKey: r.fileKey || null,
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

        return { resumes: mappedResumes, history: mappedHistory };
    }

    async generateCoverLetter(company: string, position: string, keyPoints?: string, profile?: any, userId?: string) {
        const vacancy = {
            title: position,
            employer: company,
            descriptionPreview: keyPoints || '',
            skills: [],
            salaryLabel: '',
            schedule: '',
            location: '',
        };

        const resumeContent = profile
            ? [
                profile.fullName ? `Имя: ${profile.fullName}` : '',
                profile.desiredPosition ? `Желаемая позиция: ${profile.desiredPosition}` : '',
                profile.aboutMe ? `О себе: ${profile.aboutMe}` : '',
                profile.skills?.length ? `Навыки: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}` : '',
                keyPoints ? `Ключевые моменты: ${keyPoints}` : '',
            ].filter(Boolean).join('\n')
            : `Кандидат на позицию ${position}${keyPoints ? `\nКлючевые моменты: ${keyPoints}` : ''}`;

        const { coverLetter } = await this.aiService.generateCoverLetter(vacancy, resumeContent, 'ru');

        try {
            const profileId = userId ? await this.getProfileIdForUser(userId) : null;
            if (!profileId) return coverLetter;
            await this.prisma.resume.create({
                data: {
                    profileId,
                    title: `Сопроводительное: ${company}`,
                    subtitle: `Позиция: ${position}`,
                    content: coverLetter,
                    type: 'cover_letter',
                    status: 'draft',
                },
            });
        } catch {
            // ignore if no profile
        }

        return coverLetter;
    }

    async saveResume(title: string, subtitle?: string, content?: string, type: string = 'resume', reviewData?: any, userId?: string) {
        const profileId = await this.getProfileIdForUser(userId!);
        return this.prisma.resume.create({
            data: {
                profileId,
                title,
                subtitle: subtitle || '',
                content: content || '[Документ загружен]',
                type,
                status: 'draft',
                reviewData: reviewData || undefined,
            }
        });
    }

    async uploadResumeFile(file: Express.Multer.File, title: string, userId?: string) {
        const profileId = await this.getProfileIdForUser(userId!);
        const ext = file.originalname.split('.').pop() || 'pdf';
        const key = `resumes/${profileId}/${crypto.randomUUID()}.${ext}`;

        await this.storage.uploadFile(file.buffer, key, file.mimetype || 'application/octet-stream');

        return this.prisma.resume.create({
            data: {
                profileId,
                title,
                subtitle: `Файл: ${file.originalname}`,
                content: '[Файл загружен в хранилище]',
                type: 'uploaded_file',
                status: 'draft',
                fileKey: key,
            },
        });
    }

    async getDownloadUrl(resumeId: string, userId?: string): Promise<string> {
        const profileId = await this.getProfileIdForUser(userId!);
        const resume = await this.prisma.resume.findFirst({
            where: { id: resumeId, profileId },
        });

        if (!resume) {
            throw new NotFoundException('Резюме не найдено');
        }

        if (!resume.fileKey) {
            throw new NotFoundException('Файл не прикреплён к этому резюме');
        }

        return this.storage.getPresignedDownloadUrl(resume.fileKey);
    }

    async deleteResume(id: string, userId?: string) {
        const profileId = await this.getProfileIdForUser(userId!);
        await this.prisma.resume.deleteMany({ where: { id, profileId } });
        return { success: true };
    }
}

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../../database/prisma.service';
import { SkillsService } from '../skills/skills.service';

// ─────────────────────────────────── helpers ─────────────────────────────────
const USER_ID = 'user-uuid-123';

const mockProfile = {
    id: 'profile-uuid-456',
    userId: USER_ID,
    fullName: 'Иван Иванов',
    phone: '+79991234567',
    location: 'Москва',
    desiredPosition: 'Frontend Developer',
    desiredSalaryMin: 100000,
    desiredSalaryMax: 200000,
    experienceYears: 3,
    education: [],
    workExperience: [],
    skills: ['React', 'TypeScript'],
    languages: [{ language: 'Russian', level: 'Native' }],
    aboutMe: 'Опытный разработчик',
    careerGoals: 'Стать Senior',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    analysisResults: [],
    profileSkills: [],
};

// ──────────────────────────────── mock factories ──────────────────────────────
const makePrisma = () => ({
    profile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
});

const makeSkillsService = () => ({
    syncProfileSkills: jest.fn().mockResolvedValue(undefined),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('ProfilesService', () => {
    let service: ProfilesService;
    let prisma: ReturnType<typeof makePrisma>;
    let skillsService: ReturnType<typeof makeSkillsService>;

    beforeEach(async () => {
        prisma = makePrisma();
        skillsService = makeSkillsService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfilesService,
                { provide: PrismaService, useValue: prisma },
                { provide: SkillsService, useValue: skillsService },
            ],
        }).compile();

        service = module.get<ProfilesService>(ProfilesService);
    });

    afterEach(() => jest.clearAllMocks());

    // ──────────────────────────────── getProfile ──────────────────────────────
    describe('getProfile', () => {
        it('should return a profile when it exists', async () => {
            prisma.profile.findUnique.mockResolvedValue(mockProfile);

            const result = await service.getProfile(USER_ID);

            expect(result).toEqual(mockProfile);
            expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1);
            expect(prisma.profile.findUnique).toHaveBeenCalledWith({
                where: { userId: USER_ID },
                include: {
                    analysisResults: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    profileSkills: {
                        include: { skill: true },
                    },
                },
            });
        });

        it('should throw NotFoundException when profile does not exist', async () => {
            prisma.profile.findUnique.mockResolvedValue(null);

            await expect(service.getProfile(USER_ID)).rejects.toThrow(
                new NotFoundException('Profile not found'),
            );
        });

        it('should include analysisResults (latest first)', async () => {
            const profileWithResults = {
                ...mockProfile,
                analysisResults: [
                    { id: 'ar-1', createdAt: new Date('2024-06-01'), content: {} },
                ],
            };
            prisma.profile.findUnique.mockResolvedValue(profileWithResults);

            const result = await service.getProfile(USER_ID);

            expect(result.analysisResults).toHaveLength(1);
            expect(result.analysisResults[0].id).toBe('ar-1');
        });
    });

    // ─────────────────────────────── createProfile ───────────────────────────
    describe('createProfile', () => {
        it('should upsert and return the profile', async () => {
            prisma.profile.upsert.mockResolvedValue(mockProfile);

            const dto = { fullName: 'Иван Иванов', desiredPosition: 'Frontend Developer' };
            const result = await service.createProfile(USER_ID, dto as any);

            expect(result).toEqual(mockProfile);
            expect(prisma.profile.upsert).toHaveBeenCalledTimes(1);
            expect(prisma.profile.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: USER_ID },
                    create: expect.objectContaining({ userId: USER_ID, fullName: 'Иван Иванов' }),
                    update: expect.objectContaining({ fullName: 'Иван Иванов' }),
                }),
            );
        });

        it('should sync skills when skills are provided', async () => {
            prisma.profile.upsert.mockResolvedValue(mockProfile);

            const dto = { fullName: 'Тест', skills: ['React', 'Node.js'] };
            await service.createProfile(USER_ID, dto as any);

            expect(skillsService.syncProfileSkills).toHaveBeenCalledWith(
                mockProfile.id,
                ['React', 'Node.js'],
            );
        });

        it('should handle { technical, professional } skills object', async () => {
            prisma.profile.upsert.mockResolvedValue(mockProfile);

            const dto = {
                fullName: 'Тест',
                skills: { technical: ['React', 'TypeScript'], professional: ['Communication'] },
            };
            await service.createProfile(USER_ID, dto as any);

            expect(skillsService.syncProfileSkills).toHaveBeenCalledWith(
                mockProfile.id,
                ['React', 'TypeScript', 'Communication'],
            );
        });

        it('should correctly handle JSON fields (education, workExperience, languages)', async () => {
            prisma.profile.upsert.mockResolvedValue(mockProfile);

            const dto = {
                fullName: 'Тест',
                education: [{ institution: 'МГУ', degree: 'Бакалавр', fieldOfStudy: 'ПО', startYear: 2018, endYear: 2022 }],
                workExperience: [{ company: 'Яндекс', position: 'Разработчик', startDate: '2022-01', isCurrent: true }],
                languages: [{ language: 'English', level: 'B2' }],
            };

            await service.createProfile(USER_ID, dto as any);

            const callArg = prisma.profile.upsert.mock.calls[0][0];
            expect(callArg.create.education).toHaveLength(1);
            expect(callArg.create.workExperience).toHaveLength(1);
            expect(callArg.create.languages).toHaveLength(1);
        });
    });

    // ─────────────────────────────── updateProfile ───────────────────────────
    describe('updateProfile', () => {
        it('should update and return the profile when it exists', async () => {
            prisma.profile.findUnique.mockResolvedValue(mockProfile);
            const updatedProfile = { ...mockProfile, fullName: 'Пётр Петров' };
            prisma.profile.update.mockResolvedValue(updatedProfile);

            const dto = { fullName: 'Пётр Петров' };
            const result = await service.updateProfile(USER_ID, dto as any);

            expect(result.fullName).toBe('Пётр Петров');
            expect(prisma.profile.findUnique).toHaveBeenCalledWith({ where: { userId: USER_ID } });
            expect(prisma.profile.update).toHaveBeenCalledWith({
                where: { userId: USER_ID },
                data: expect.objectContaining({ fullName: 'Пётр Петров' }),
            });
        });

        it('should throw NotFoundException when profile does not exist', async () => {
            prisma.profile.findUnique.mockResolvedValue(null);

            await expect(
                service.updateProfile(USER_ID, { fullName: 'Test' } as any),
            ).rejects.toThrow(
                new NotFoundException('Profile not found. Create a profile first.'),
            );

            expect(prisma.profile.update).not.toHaveBeenCalled();
        });

        it('should not pass undefined JSON fields to Prisma', async () => {
            prisma.profile.findUnique.mockResolvedValue(mockProfile);
            prisma.profile.update.mockResolvedValue(mockProfile);

            const dto = { fullName: 'Анна' };
            await service.updateProfile(USER_ID, dto as any);

            const updateCall = prisma.profile.update.mock.calls[0][0];
            expect(updateCall.data.skills).toBeUndefined();
            expect(updateCall.data.education).toBeUndefined();
        });
    });

    // ─────────────────────────────── deleteProfile ───────────────────────────
    describe('deleteProfile', () => {
        it('should delete the profile and return success message', async () => {
            prisma.profile.findUnique.mockResolvedValue(mockProfile);
            prisma.profile.delete.mockResolvedValue(mockProfile);

            const result = await service.deleteProfile(USER_ID);

            expect(result).toEqual({ message: 'Profile deleted successfully' });
            expect(prisma.profile.findUnique).toHaveBeenCalledWith({ where: { userId: USER_ID } });
            expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { userId: USER_ID } });
        });

        it('should throw NotFoundException when profile does not exist', async () => {
            prisma.profile.findUnique.mockResolvedValue(null);

            await expect(service.deleteProfile(USER_ID)).rejects.toThrow(
                new NotFoundException('Profile not found'),
            );

            expect(prisma.profile.delete).not.toHaveBeenCalled();
        });
    });
});

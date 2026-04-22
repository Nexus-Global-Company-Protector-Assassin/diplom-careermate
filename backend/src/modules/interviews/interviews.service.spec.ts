import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { PrismaService } from '../../database/prisma.service';

const mockProfile = { id: 'profile-uuid-1' };

const mockInterview = {
    id: 'interview-uuid-1',
    profileId: 'profile-uuid-1',
    company: 'Yandex',
    position: 'Frontend Developer',
    date: '2025-06-01',
    time: '10:00',
    type: 'online',
    location: null,
    notes: null,
    status: 'upcoming',
    createdAt: new Date('2025-01-01'),
};

const makePrisma = () => ({
    profile: { findFirst: jest.fn() },
    interview: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
});

describe('InterviewsService', () => {
    let service: InterviewsService;
    let prisma: ReturnType<typeof makePrisma>;

    beforeEach(async () => {
        prisma = makePrisma();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InterviewsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<InterviewsService>(InterviewsService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return interviews for existing profile', async () => {
            prisma.profile.findFirst.mockResolvedValue(mockProfile);
            prisma.interview.findMany.mockResolvedValue([mockInterview]);

            const result = await service.getAll();

            expect(result).toEqual([mockInterview]);
            expect(prisma.interview.findMany).toHaveBeenCalledWith({
                where: { profileId: mockProfile.id },
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should throw NotFoundException when no profile exists', async () => {
            prisma.profile.findFirst.mockResolvedValue(null);

            await expect(service.getAll()).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create an interview with default type "online"', async () => {
            prisma.profile.findFirst.mockResolvedValue(mockProfile);
            prisma.interview.create.mockResolvedValue(mockInterview);

            const dto = { company: 'Yandex', position: 'Frontend Developer', date: '2025-06-01', time: '10:00' };
            const result = await service.create(dto);

            expect(result).toEqual(mockInterview);
            expect(prisma.interview.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    profileId: mockProfile.id,
                    company: 'Yandex',
                    position: 'Frontend Developer',
                    type: 'online',
                    status: 'upcoming',
                }),
            });
        });

        it('should use provided type when given', async () => {
            prisma.profile.findFirst.mockResolvedValue(mockProfile);
            prisma.interview.create.mockResolvedValue({ ...mockInterview, type: 'office' });

            await service.create({ company: 'X', position: 'Y', date: '2025', time: '12:00', type: 'office' });

            const createArg = prisma.interview.create.mock.calls[0][0];
            expect(createArg.data.type).toBe('office');
        });

        it('should throw NotFoundException when no profile exists', async () => {
            prisma.profile.findFirst.mockResolvedValue(null);

            await expect(
                service.create({ company: 'X', position: 'Y', date: '2025', time: '10:00' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateStatus', () => {
        it('should update interview status', async () => {
            const updated = { ...mockInterview, status: 'completed' };
            prisma.interview.update.mockResolvedValue(updated);

            const result = await service.updateStatus('interview-uuid-1', 'completed');

            expect(result).toEqual(updated);
            expect(prisma.interview.update).toHaveBeenCalledWith({
                where: { id: 'interview-uuid-1' },
                data: { status: 'completed' },
            });
        });
    });
});

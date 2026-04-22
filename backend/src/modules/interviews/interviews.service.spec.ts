import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { PrismaService } from '../../database/prisma.service';

const makePrisma = () => ({
    profile: {
        findFirst: jest.fn(),
    },
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
        it('should return interviews for the first profile', async () => {
            prisma.profile.findFirst.mockResolvedValue({ id: 'profile-1' });
            prisma.interview.findMany.mockResolvedValue([{ id: 'i1', company: 'ACME' }]);

            const result = await service.getAll();

            expect(result).toEqual([{ id: 'i1', company: 'ACME' }]);
            expect(prisma.interview.findMany).toHaveBeenCalledWith({
                where: { profileId: 'profile-1' },
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should throw NotFoundException when no profile exists', async () => {
            prisma.profile.findFirst.mockResolvedValue(null);

            await expect(service.getAll()).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create interview and return it', async () => {
            const dto = { company: 'Test', position: 'Dev', date: '2025-01-01', time: '10:00' };
            const created = { id: 'i2', profileId: 'profile-1', ...dto, type: 'online', status: 'upcoming' };

            prisma.profile.findFirst.mockResolvedValue({ id: 'profile-1' });
            prisma.interview.create.mockResolvedValue(created);

            const result = await service.create(dto);

            expect(result).toEqual(created);
            expect(prisma.interview.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company: 'Test', position: 'Dev', profileId: 'profile-1' }),
                }),
            );
        });

        it('should throw NotFoundException when no profile exists', async () => {
            prisma.profile.findFirst.mockResolvedValue(null);

            await expect(service.create({ company: 'X', position: 'Y', date: '2025', time: '09:00' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateStatus', () => {
        it('should update interview status and return result', async () => {
            const updated = { id: '1', status: 'completed' };
            prisma.interview.update.mockResolvedValue(updated);

            const result = await service.updateStatus('1', 'completed');

            expect(result).toEqual(updated);
            expect(prisma.interview.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: 'completed' },
            });
        });
    });
});
